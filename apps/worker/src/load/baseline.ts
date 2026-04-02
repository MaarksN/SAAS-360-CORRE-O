import { runParallelExecutionLoadTest } from "./parallelLoad.js";
import { createLogger } from "@birthub/logger";

const logger = createLogger("worker-baseline");

async function main() {
  logger.info("Starting baseline run");
  const metrics = await runParallelExecutionLoadTest(500);
  logger.info({ metrics }, "Baseline metrics collected");
}

main().catch((error) => logger.error({ error }, "Baseline run failed"));
