export type MetricLabelValue = string | number | boolean | null | undefined;
export type MetricLabels = Record<string, MetricLabelValue>;

export const DEFAULT_DURATION_BUCKETS_MS = [
  5,
  10,
  25,
  50,
  100,
  250,
  500,
  1000,
  2500,
  5000,
  10000
];

interface CounterMetric {
  help: string;
  type: "counter";
  values: Map<string, number>;
}

interface GaugeMetric {
  help: string;
  type: "gauge";
  values: Map<string, number>;
}

interface HistogramMetricSeries {
  buckets: number[];
  count: number;
  counts: number[];
  sum: number;
}

interface HistogramMetric {
  help: string;
  type: "histogram";
  values: Map<string, HistogramMetricSeries>;
}

type MetricDefinition = CounterMetric | GaugeMetric | HistogramMetric;

export class MetricsRegistry {
  private readonly metrics = new Map<string, MetricDefinition>();

  registerCounter(name: string, help: string): CounterMetric {
    const existing = this.metrics.get(name);
    if (existing) {
      if (existing.type !== "counter") {
        throw new Error(`Metric ${name} is already registered with a different type.`);
      }
      return existing;
    }

    const metric: CounterMetric = {
      help,
      type: "counter",
      values: new Map<string, number>()
    };
    this.metrics.set(name, metric);
    return metric;
  }

  registerGauge(name: string, help: string): GaugeMetric {
    const existing = this.metrics.get(name);
    if (existing) {
      if (existing.type !== "gauge") {
        throw new Error(`Metric ${name} is already registered with a different type.`);
      }
      return existing;
    }

    const metric: GaugeMetric = {
      help,
      type: "gauge",
      values: new Map<string, number>()
    };
    this.metrics.set(name, metric);
    return metric;
  }

  registerHistogram(name: string, help: string): HistogramMetric {
    const existing = this.metrics.get(name);
    if (existing) {
      if (existing.type !== "histogram") {
        throw new Error(`Metric ${name} is already registered with a different type.`);
      }
      return existing;
    }

    const metric: HistogramMetric = {
      help,
      type: "histogram",
      values: new Map<string, HistogramMetricSeries>()
    };
    this.metrics.set(name, metric);
    return metric;
  }

  incrementCounter(name: string, labels: MetricLabels, amount: number, help: string): void {
    const metric = this.registerCounter(name, help);
    const key = serializeLabels(labels);
    metric.values.set(key, (metric.values.get(key) ?? 0) + amount);
  }

  setGauge(name: string, value: number, labels: MetricLabels, help: string): void {
    const metric = this.registerGauge(name, help);
    metric.values.set(serializeLabels(labels), value);
  }

  observeHistogram(
    name: string,
    value: number,
    labels: MetricLabels,
    options: {
      buckets: number[];
      help: string;
    }
  ): void {
    const metric = this.registerHistogram(name, options.help);
    const key = serializeLabels(labels);
    const buckets = [...options.buckets].sort((left, right) => left - right);
    const series =
      metric.values.get(key) ??
      {
        buckets,
        count: 0,
        counts: Array.from({ length: buckets.length }, () => 0),
        sum: 0
      };

    series.count += 1;
    series.sum += value;
    for (let index = 0; index < buckets.length; index += 1) {
      const bucket = buckets[index];
      if (bucket !== undefined && value <= bucket) {
        series.counts[index] = (series.counts[index] ?? 0) + 1;
      }
    }

    metric.values.set(key, series);
  }

  reset(): void {
    this.metrics.clear();
  }

  render(): string {
    const sections: string[] = [];

    for (const [name, metric] of this.metrics.entries()) {
      sections.push(`# HELP ${name} ${metric.help}`);
      sections.push(`# TYPE ${name} ${metric.type}`);

      if (metric.type === "counter" || metric.type === "gauge") {
        for (const [labels, value] of metric.values.entries()) {
          sections.push(`${name}${labels} ${value}`);
        }
        continue;
      }

      const histogramValues: Map<string, HistogramMetricSeries> = metric.values;
      for (const [labels, series] of histogramValues.entries()) {
        const baseLabels = labels === "" ? [] : labels.slice(1, -1).split(",").filter(Boolean);

        for (let index = 0; index < series.buckets.length; index += 1) {
          const bucketLabels = [...baseLabels, `le="${series.buckets[index]}"`].join(",");
          sections.push(`${name}_bucket{${bucketLabels}} ${series.counts[index]}`);
        }

        const infLabels = [...baseLabels, 'le="+Inf"'].join(",");
        sections.push(`${name}_bucket{${infLabels}} ${series.count}`);
        sections.push(`${name}_sum${labels} ${series.sum}`);
        sections.push(`${name}_count${labels} ${series.count}`);
      }
    }

    return sections.join("\n");
  }
}

function normalizeLabels(labels: MetricLabels = {}): Array<[string, string]> {
  return Object.entries(labels)
    .filter(([, value]) => value !== null && value !== undefined)
    .map<[string, string]>(([key, value]) => [key, String(value).replace(/"/g, '\\"')])
    .sort(([left], [right]) => left.localeCompare(right));
}

function serializeLabels(labels: MetricLabels = {}): string {
  const normalized = normalizeLabels(labels);
  if (normalized.length === 0) {
    return "";
  }

  return `{${normalized.map(([key, value]) => `${key}="${value}"`).join(",")}}`;
}

const globalMetrics = globalThis as typeof globalThis & {
  __birthubMetricsApi?: {
    incrementCounter: (
      name: string,
      labels?: MetricLabels,
      amount?: number,
      help?: string
    ) => void;
    observeHistogram: (
      name: string,
      value: number,
      labels?: MetricLabels,
      options?: {
        buckets?: number[];
        help?: string;
      }
    ) => void;
    setGauge: (name: string, value: number, labels?: MetricLabels, help?: string) => void;
  };
  __birthubMetricsRegistry?: MetricsRegistry;
};

export function getMetricsRegistry(): MetricsRegistry {
  globalMetrics.__birthubMetricsRegistry ??= new MetricsRegistry();
  globalMetrics.__birthubMetricsApi ??= {
    incrementCounter,
    observeHistogram,
    setGauge
  };
  return globalMetrics.__birthubMetricsRegistry;
}

export function incrementCounter(
  name: string,
  labels: MetricLabels = {},
  amount = 1,
  help = `${name} counter`
): void {
  getMetricsRegistry().incrementCounter(name, labels, amount, help);
}

export function setGauge(
  name: string,
  value: number,
  labels: MetricLabels = {},
  help = `${name} gauge`
): void {
  getMetricsRegistry().setGauge(name, value, labels, help);
}

export function observeHistogram(
  name: string,
  value: number,
  labels: MetricLabels = {},
  options: {
    buckets?: number[];
    help?: string;
  } = {}
): void {
  getMetricsRegistry().observeHistogram(name, value, labels, {
    buckets: options.buckets ?? DEFAULT_DURATION_BUCKETS_MS,
    help: options.help ?? `${name} histogram`
  });
}

export function renderPrometheusMetrics(): string {
  return getMetricsRegistry().render();
}

export function resetMetricsRegistry(): void {
  getMetricsRegistry().reset();
}

export type GlobalMetricsRegistry = typeof globalMetrics;
