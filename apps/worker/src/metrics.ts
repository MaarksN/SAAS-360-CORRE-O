import { createRequire } from "node:module";

type UpDownCounterLike = {
  add: (value: number, attributes?: Record<string, string>) => void;
};

type MeterLike = {
  createUpDownCounter: (
    name: string,
    options: {
      description: string;
    }
  ) => UpDownCounterLike;
};

type MeterProviderModule = {
  MeterProvider: new (options: {
    readers?: unknown[];
    resource?: unknown;
  }) => {
    getMeter: (name: string) => MeterLike;
  };
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

type ResourcesModule = {
  resourceFromAttributes: (attributes: Record<string, string>) => unknown;
};

const runtimeRequire = createRequire(import.meta.url) as (specifier: string) => unknown;
const noopCounter: UpDownCounterLike = {
  add: () => undefined
};

function loadOptionalModule<T>(specifier: string): T | null {
  try {
    return runtimeRequire(specifier) as T;
  } catch {
    return null;
  }
}

function createWorkerQueueGauge(): UpDownCounterLike {
  const meterProviderModule = loadOptionalModule<MeterProviderModule>(
    "@opentelemetry/sdk-metrics"
  );
  const metricReaderModule = loadOptionalModule<MetricReaderModule>(
    "@opentelemetry/sdk-metrics"
  );
  const metricExporterModule = loadOptionalModule<MetricExporterModule>(
    "@opentelemetry/exporter-metrics-otlp-http"
  );
  const resourcesModule = loadOptionalModule<ResourcesModule>("@opentelemetry/resources");

  if (
    !meterProviderModule ||
    !metricReaderModule ||
    !metricExporterModule ||
    !resourcesModule
  ) {
    return noopCounter;
  }

  const otlpUrl = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318";
  const metricExporter = new metricExporterModule.OTLPMetricExporter({
    url: `${otlpUrl.replace(/\/$/, "")}/v1/metrics`
  });
  const meterProvider = new meterProviderModule.MeterProvider({
    readers: [
      new metricReaderModule.PeriodicExportingMetricReader({
        exportIntervalMillis: 10000,
        exporter: metricExporter
      })
    ],
    resource: resourcesModule.resourceFromAttributes({
      "service.name": process.env.OTEL_SERVICE_NAME ?? "birthub-worker"
    })
  });

  return meterProvider
    .getMeter("birthub-worker-metrics")
    .createUpDownCounter("worker_queue_depth", {
      description: "Current depth of the worker queue (BullMQ)"
    });
}

export const workerQueueGauge = createWorkerQueueGauge();

export function updateWorkerQueueDepth(depth: number, queueName: string): void {
  workerQueueGauge.add(depth, { queue: queueName });
}
