import { createRequire } from "node:module";

import { createLogger } from "@birthub/logger";

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

type WorkerOtelRuntime = {
  autoInstrumentations: AutoInstrumentationsModule | null;
  metricExporter: MetricExporterModule | null;
  metricReader: MetricReaderModule | null;
  nodeSdk: NodeSdkModule | null;
  resources: ResourcesModule | null;
  traceExporter: TraceExporterModule | null;
};

const logger = createLogger("worker-otel");
const runtimeRequire = createRequire(import.meta.url) as (specifier: string) => unknown;

let cachedRuntime: WorkerOtelRuntime | undefined;
let hasWarnedMissingRuntime = false;
let sdk: NodeSdkLike | undefined;

function loadOptionalModule<T>(specifier: string): T | null {
  try {
    return runtimeRequire(specifier) as T;
  } catch {
    return null;
  }
}

function getWorkerOtelRuntime(): WorkerOtelRuntime {
  if (cachedRuntime) {
    return cachedRuntime;
  }

  cachedRuntime = {
    autoInstrumentations: loadOptionalModule<AutoInstrumentationsModule>(
      "@opentelemetry/auto-instrumentations-node"
    ),
    metricExporter: loadOptionalModule<MetricExporterModule>(
      "@opentelemetry/exporter-metrics-otlp-http"
    ),
    metricReader: loadOptionalModule<MetricReaderModule>("@opentelemetry/sdk-metrics"),
    nodeSdk: loadOptionalModule<NodeSdkModule>("@opentelemetry/sdk-node"),
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
    "OpenTelemetry runtime dependencies are unavailable; worker instrumentation disabled"
  );
}

function normalizeOtelEndpoint(endpoint: string): string {
  return endpoint.replace(/\/$/, "");
}

function buildMetricReader(runtime: WorkerOtelRuntime, endpoint: string): unknown {
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

export function initializeWorkerOpenTelemetry(): void {
  const otlpUrl = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  if (sdk || !otlpUrl) {
    return;
  }

  const runtime = getWorkerOtelRuntime();

  if (!runtime.autoInstrumentations || !runtime.nodeSdk || !runtime.resources || !runtime.traceExporter) {
    warnMissingRuntimeOnce();
    return;
  }

  const endpoint = normalizeOtelEndpoint(otlpUrl);
  const metricReader = buildMetricReader(runtime, endpoint);
  const currentSdk = new runtime.nodeSdk.NodeSDK({
    instrumentations: [
      runtime.autoInstrumentations.getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": {
          enabled: false
        }
      })
    ],
    ...(metricReader ? { metricReader } : {}),
    resource: runtime.resources.resourceFromAttributes({
      "service.name": process.env.OTEL_SERVICE_NAME ?? "birthub-worker"
    }),
    traceExporter: new runtime.traceExporter.OTLPTraceExporter({
      url: `${endpoint}/v1/traces`
    })
  });

  sdk = currentSdk;
  void currentSdk.start();
}

export async function shutdownWorkerOpenTelemetry(): Promise<void> {
  if (!sdk) {
    return;
  }

  await sdk.shutdown();
  sdk = undefined;
}
