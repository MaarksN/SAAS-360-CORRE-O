import type { PrismaClient } from "@prisma/client";

import { F8_CONFIG } from "../f8.config.js";
import { createPrismaClient } from "../src/client.js";
import { runCommand, getPrismaBinaryPath } from "./lib/process.js";
import { databasePackageRoot, schemaPath } from "./lib/paths.js";
import { createLogger } from "@birthub/logger";

const logger = createLogger("db-migrate-deploy-safe");

async function runTsScript(scriptName: string): Promise<void> {
  const scriptPath = `${databasePackageRoot}/scripts/${scriptName}`;
  const result = await runCommand(process.execPath, ["--import", "tsx", scriptPath], {
    cwd: databasePackageRoot
  });

  process.stdout.write(result.output);

  if (result.code !== 0) {
    throw new Error(`${scriptName} failed with exit code ${result.code}.`);
  }
}

async function acquireLock(prisma: PrismaClient): Promise<void> {
  const rows = await prisma.$queryRaw<Array<{ locked: boolean }>>`
    SELECT pg_try_advisory_lock(${F8_CONFIG.advisoryLockId}) AS locked
  `;

  if (!rows[0]?.locked) {
    throw new Error("Another migration process is already holding the F8 advisory lock.");
  }
}

async function releaseLock(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRaw`SELECT pg_advisory_unlock(${F8_CONFIG.advisoryLockId})`;
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for migrate-deploy-safe.");
  }

  const prisma = createPrismaClient();

  try {
    await runTsScript("check-migration-governance.ts");
    await acquireLock(prisma);

    const migrateResult = await runCommand(getPrismaBinaryPath(), [
      "migrate",
      "deploy",
      "--schema",
      schemaPath
    ]);

    process.stdout.write(migrateResult.output);

    if (migrateResult.code !== 0) {
      throw new Error(`prisma migrate deploy failed with exit code ${migrateResult.code}.`);
    }

    await runTsScript("post-migration-checklist.ts");
  } finally {
    try {
      await releaseLock(prisma);
    } catch {
      // Keep the original failure as the main signal.
    }

    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  logger.error(error);
  process.exitCode = 1;
});
