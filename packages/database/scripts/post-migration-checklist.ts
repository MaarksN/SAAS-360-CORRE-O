import { resolve } from "node:path";

import { runCommand } from "./lib/process.js";
import { databasePackageRoot } from "./lib/paths.js";
import { createLogger } from "@birthub/logger";

const logger = createLogger("db-post-migration-checklist");

async function runScript(scriptName: string): Promise<void> {
  const scriptPath = resolve(databasePackageRoot, "scripts", scriptName);
  const result = await runCommand(process.execPath, ["--import", "tsx", scriptPath], {
    cwd: databasePackageRoot
  });

  process.stdout.write(result.output);

  if (result.code !== 0) {
    throw new Error(`${scriptName} failed with exit code ${result.code}.`);
  }
}

async function main(): Promise<void> {
  for (const script of [
    "check-migration-governance.ts",
    "compare-migration-state.ts",
    "check-schema-drift.ts",
    "check-tenancy-controls.ts",
    "check-fk-indexes.ts",
    "check-raw-query-joins.ts",
    "check-referential-integrity.ts",
    "analyze-performance.ts"
  ]) {
    await runScript(script);
  }
}

void main().catch((error) => {
  logger.error(error);
  process.exitCode = 1;
});
