import { runParallelExecutionLoadTest } from "./parallelLoad.js";
import { createLogger } from "@birthub/logger";

const logger = createLogger("worker-benchmark");

async function main() {
  const executions = 100000;

  const start = performance.now();
  const metrics = await runParallelExecutionLoadTest(executions);
  const end = performance.now();

  logger.info(
    {
      benchmarkDurationMs: Number((end - start).toFixed(2)),
      executions,
      metrics: {
        p50Ms: Number(metrics.p50Ms.toFixed(2)),
        p95Ms: Number(metrics.p95Ms.toFixed(2)),
        p99Ms: Number(metrics.p99Ms.toFixed(2)),
        successCount: metrics.successCount,
        totalMs: Number(metrics.totalMs.toFixed(2))
      }
    },
    "Benchmark results"
  );
}

main().catch((error) => logger.error({ error }, "Benchmark run failed"));
