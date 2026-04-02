import { createRequire } from "node:module";

import type { ApiConfig } from "@birthub/config";
import { createLogger } from "@birthub/logger";

type OtelSpan = {
  setAttribute: (key: string, value: boolean | string) => void;
};

type OtelApiModule = {
  context: {
    active: () => unknown;
  };
  trace: {
    getSpan: (context: unknown) => OtelSpan | undefined;
  };
};

type NodeSdkLike = {
  shutdown: () => Promise<void>;
  start: () => Promise<void> | void;
};

type NodeSdkOptions = {
  instrumentations: unknown[];
  metricReader?: unknown;
  resource: unknown;
  traceExporter: unknown;
};

type NodeSdkModule = {
  NodeSDK: new (options: NodeSdkOptions) => NodeSdkLike;
};

type AutoInstrumentationsModule = {
  getNodeAutoInstrumentations: (options: Record<string, unknown>) => unknown;
};

type ResourcesModule = {
  resourceFromAttributes: (attributes: Record<string, string>) => unknown;
};

type TraceExporterModule = {
  OTLPTraceExporter: new (options: { url: string }) => unknown;
};

type MetricReaderModule = {
  PeriodicExportingMetricReader: new (options: {
    exportIntervalMillis: number;
    exporter: unknown;
  }) => unknown;
};

type MetricExporterModule = {
  OTLPMetricExporter: new (options: { url: string }) => unknown;
};

type PrismaInstrumentationModule = {
  PrismaInstrumentation: new () => unknown;
};

type OtelRuntime = {
  api: OtelApiModule | null;
  autoInstrumentations: AutoInstrumentationsModule | null;
  metricExporter: MetricExporterModule | null;
  metricReader: MetricReaderModule | null;
  nodeSdk: NodeSdkModule | null;
  prismaInstrumentation: PrismaInstrumentationModule | null;
  resources: ResourcesModule | null;
  traceExporter: TraceExporterModule | null;
};

const logger = createLogger("api-otel");
const runtimeRequire = createRequire(import.meta.url) as (specifier: string) => unknown;
const forceSampledTenants = new Set<string>();

let cachedRuntime: OtelRuntime | undefined;
let hasWarnedMissingRuntime = false;
let sdk: NodeSdkLike | undefined;

function loadOptionalModule<T>(specifier: string): T | null {
  try {
    return runtimeRequire(specifier) as T;
  } catch {
    return null;
  }
}

function getOtelRuntime(): OtelRuntime {
  if (cachedRuntime) {
    return cachedRuntime;
  }

  cachedRuntime = {
    api: loadOptionalModule<OtelApiModule>("@opentelemetry/api"),
    autoInstrumentations: loadOptionalModule<AutoInstrumentationsModule>(
      "@opentelemetry/auto-instrumentations-node"
    ),
    metricExporter: loadOptionalModule<MetricExporterModule>(
      "@opentelemetry/exporter-metrics-otlp-http"
    ),
    metricReader: loadOptionalModule<MetricReaderModule>("@opentelemetry/sdk-metrics"),
    nodeSdk: loadOptionalModule<NodeSdkModule>("@opentelemetry/sdk-node"),
    prismaInstrumentation: loadOptionalModule<PrismaInstrumentationModule>(
      "@prisma/instrumentation"
    ),
    resources: loadOptionalModule<ResourcesModule>("@opentelemetry/resources"),
    traceExporter: loadOptionalModule<TraceExporterModule>(
      "@opentelemetry/exporter-trace-otlp-http"
    )
  };

  return cachedRuntime;
}

function warnMissingRuntimeOnce(): void {
  if (hasWarnedMissingRuntime) {
    return;
  }

  hasWarnedMissingRuntime = true;
  logger.warn(
    {
      event: "observability.otel.runtime_unavailable"
    },
    "OpenTelemetry runtime dependencies are unavailable; API startup instrumentation disabled"
  );
}

function normalizeOtelEndpoint(endpoint: string): string {
  return endpoint.replace(/\/$/, "");
}

function buildInstrumentations(runtime: OtelRuntime): unknown[] {
  if (!runtime.autoInstrumentations) {
    return [];
  }

  const instrumentations: unknown[] = [
    runtime.autoInstrumentations.getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": {
        enabled: false
      }
    })
  ];

  if (runtime.prismaInstrumentation) {
    instrumentations.push(new runtime.prismaInstrumentation.PrismaInstrumentation());
  }

  return instrumentations;
}

function buildMetricReader(runtime: OtelRuntime, endpoint: string): unknown {
  if (!runtime.metricExporter || !runtime.metricReader) {
    return undefined;
  }

  return new runtime.metricReader.PeriodicExportingMetricReader({
    exportIntervalMillis: 10000,
    exporter: new runtime.metricExporter.OTLPMetricExporter({
      url: `${endpoint}/v1/metrics`
    })
  });
}

function resolveActiveSpan(): OtelSpan | undefined {
  const api = getOtelRuntime().api;

  if (!api) {
    return undefined;
  }

  return api.trace.getSpan(api.context.active());
}

export function annotateTenantSpan(input: {
  tenantId?: string | null;
  tenantSlug?: string | null;
}): void {
  const span = resolveActiveSpan();

  if (!span) {
    return;
  }

  if (input.tenantId) {
    span.setAttribute("tenant.id", input.tenantId);
    span.setAttribute("tenant.force_sampled", forceSampledTenants.has(input.tenantId));
  }

  if (input.tenantSlug) {
    span.setAttribute("tenant.slug", input.tenantSlug);
  }
}

export function flagTenantForFullSampling(tenantId: string): void {
  forceSampledTenants.add(tenantId);
}

export function shouldForceTenantSampling(tenantId?: string | null): boolean {
  return Boolean(tenantId && forceSampledTenants.has(tenantId));
}

// ADR-009: the Cycle 1 API coexists with legacy services, so telemetry is isolated behind an opt-in exporter.
export function initializeOpenTelemetry(config: ApiConfig): void {
  if (sdk || !config.OTEL_EXPORTER_OTLP_ENDPOINT) {
    return;
  }

  const runtime = getOtelRuntime();

  if (!runtime.nodeSdk || !runtime.resources || !runtime.traceExporter) {
    warnMissingRuntimeOnce();
    return;
  }

  const endpoint = normalizeOtelEndpoint(config.OTEL_EXPORTER_OTLP_ENDPOINT);
  const metricReader = buildMetricReader(runtime, endpoint);
  const currentSdk = new runtime.nodeSdk.NodeSDK({
    instrumentations: buildInstrumentations(runtime),
    ...(metricReader ? { metricReader } : {}),
    resource: runtime.resources.resourceFromAttributes({
      "service.name": config.OTEL_SERVICE_NAME
    }),
    traceExporter: new runtime.traceExporter.OTLPTraceExporter({
      url: `${endpoint}/v1/traces`
    })
  });

  sdk = currentSdk;
  void currentSdk.start();
}

export async function shutdownOpenTelemetry(): Promise<void> {
  if (!sdk) {
    return;
  }

  await sdk.shutdown();
  sdk = undefined;
}
