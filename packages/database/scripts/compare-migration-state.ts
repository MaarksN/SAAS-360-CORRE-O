import { F8_CONFIG } from "../f8.config.js";
import { createPrismaClient } from "../src/client.js";
import { writeJsonReport, writeTextReport } from "./lib/report.js";
import { createLogger } from "@birthub/logger";

const logger = createLogger("db-compare-migration-state");

type MigrationState = {
  environment: string;
  migrations: string[];
};

function resolveEnvironmentUrls(): Record<string, string> {
  const candidates = {
    dev: process.env.DATABASE_URL_DEV,
    prod: process.env.DATABASE_URL_PROD,
    staging: process.env.DATABASE_URL_STAGING
  };

  return Object.fromEntries(
    Object.entries(candidates).filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

async function readAppliedMigrations(databaseUrl: string): Promise<string[]> {
  const prisma = createPrismaClient({ databaseUrl });

  try {
    const rows = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE rolled_back_at IS NULL
      ORDER BY migration_name ASC
    `;

    return rows.map((row) => row.migration_name);
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  const environmentUrls = resolveEnvironmentUrls();
  const environmentNames = Object.keys(environmentUrls);

  if (environmentNames.length < 2) {
    const report = {
      checkedAt: new Date().toISOString(),
      ok: true,
      reason: "At least two environment URLs are required (DATABASE_URL_DEV/STAGING/PROD).",
      skipped: true
    };

    const jsonPath = await writeJsonReport("f8/migration-state-report.json", report);
    const txtPath = await writeTextReport(
      "f8/migration-state-report.txt",
      "Migration state comparison skipped because less than two environment URLs were configured."
    );

    logger.info(`Migration state comparison skipped.\nArtifacts:\n- ${jsonPath}\n- ${txtPath}`);
    return;
  }

  const states: MigrationState[] = [];

  for (const environment of environmentNames) {
    const databaseUrl = environmentUrls[environment];

    if (!databaseUrl) {
      continue;
    }

    states.push({
      environment,
      migrations: await readAppliedMigrations(databaseUrl)
    });
  }

  const baseline = JSON.stringify(states[0]?.migrations ?? []);
  const issues = states
    .filter((state) => JSON.stringify(state.migrations) !== baseline)
    .map((state) => `${state.environment}: migration state differs from baseline.`);

  const missingEnvironments = F8_CONFIG.expectedMigrationEnvironments.filter(
    (environment) => !environmentNames.includes(environment)
  );
  const report = {
    checkedAt: new Date().toISOString(),
    issues,
    missingEnvironments,
    ok: issues.length === 0,
    states
  };

  const text = [
    `Migration state comparison: ${report.ok ? "PASS" : "FAIL"}`,
    ...states.map((state) => `${state.environment}: ${state.migrations.at(-1) ?? "no migrations"}`),
    ...(missingEnvironments.length === 0 ? [] : ["", `Missing environment URLs: ${missingEnvironments.join(", ")}`]),
    ...(issues.length === 0 ? [] : ["", ...issues])
  ].join("\n");

  const jsonPath = await writeJsonReport("f8/migration-state-report.json", report);
  const txtPath = await writeTextReport("f8/migration-state-report.txt", text);

  logger.info(`${text}\n\nArtifacts:\n- ${jsonPath}\n- ${txtPath}`);

  if (!report.ok) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  logger.error(error);
  process.exitCode = 1;
});
