import { resolve } from "node:path";

import { getPrismaBinaryPath, runCommand } from "./lib/process.js";
import { databasePackageRoot, schemaPath } from "./lib/paths.js";
import { createLogger } from "@birthub/logger";

const logger = createLogger("db-validate-migrations-on-test-db");

function looksDisposableDatabase(url: string): boolean {
  return /(localhost|127\.0\.0\.1|shadow|test|validation|staging)/i.test(url);
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for validation.");
  }

  if (!looksDisposableDatabase(databaseUrl) && process.env.ALLOW_DESTRUCTIVE_DB_VALIDATION !== "true") {
    throw new Error(
      "Refusing to reset a non-disposable database. Set ALLOW_DESTRUCTIVE_DB_VALIDATION=true only on dedicated validation databases."
    );
  }

  const prismaBinary = getPrismaBinaryPath();
  const resetResult = await runCommand(prismaBinary, [
    "migrate",
    "reset",
    "--force",
    "--skip-seed",
    "--schema",
    schemaPath
  ]);
  process.stdout.write(resetResult.output);

  if (resetResult.code !== 0) {
    throw new Error(`prisma migrate reset failed with exit code ${resetResult.code}.`);
  }

  const seedResult = await runCommand(process.execPath, ["--import", "tsx", resolve(databasePackageRoot, "prisma", "seed.ts")], {
    cwd: databasePackageRoot,
    env: {
      SEED_PROFILE: process.env.SEED_PROFILE ?? "ci"
    }
  });
  process.stdout.write(seedResult.output);

  if (seedResult.code !== 0) {
    throw new Error(`seed.ts failed with exit code ${seedResult.code}.`);
  }

  const checklistResult = await runCommand(process.execPath, ["--import", "tsx", resolve(databasePackageRoot, "scripts", "post-migration-checklist.ts")], {
    cwd: databasePackageRoot
  });
  process.stdout.write(checklistResult.output);

  if (checklistResult.code !== 0) {
    throw new Error(`post-migration-checklist.ts failed with exit code ${checklistResult.code}.`);
  }
}

void main().catch((error) => {
  logger.error(error);
  process.exitCode = 1;
});
