import assert from "node:assert/strict";
import test from "node:test";

import {
  incrementCounter,
  observeHistogram,
  renderPrometheusMetrics,
  resetMetricsRegistry,
  setGauge
} from "./metrics.js";

void test("metrics registry renders counters, gauges and histograms in Prometheus format", () => {
  resetMetricsRegistry();

  incrementCounter(
    "birthub_counter_total",
    { service: "api", status: "success" },
    2,
    "A test counter."
  );
  setGauge("birthub_gauge", 42, { service: "worker" }, "A test gauge.");
  observeHistogram(
    "birthub_duration_ms",
    120,
    { route: "/health" },
    {
      buckets: [50, 100, 250],
      help: "A test histogram."
    }
  );

  const output = renderPrometheusMetrics();

  assert.match(output, /# HELP birthub_counter_total A test counter\./);
  assert.match(output, /birthub_counter_total\{service="api",status="success"\} 2/);
  assert.match(output, /# TYPE birthub_gauge gauge/);
  assert.match(output, /birthub_gauge\{service="worker"\} 42/);
  assert.match(output, /# TYPE birthub_duration_ms histogram/);
  assert.match(output, /birthub_duration_ms_bucket\{route="\/health",le="250"\} 1/);
  assert.match(output, /birthub_duration_ms_count\{route="\/health"\} 1/);
});
