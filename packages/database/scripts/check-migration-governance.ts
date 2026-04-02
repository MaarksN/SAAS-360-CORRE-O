import { F8_CONFIG } from "../f8.config.js";
import {
  collectCreatedRoutines,
  collectCreatedViews,
  collectRiskFlags,
  containsRlsDisable,
  listMigrationDirectories,
  readMigrationRegistry,
  readMigrationSql,
  validateRegistryEntryShape
} from "./lib/migrations.js";
import { writeJsonReport, writeTextReport } from "./lib/report.js";
import { createLogger } from "@birthub/logger";

const logger = createLogger("db-check-migration-governance");

type MigrationAudit = {
  issues: string[];
  migration: string;
  riskFlags: string[];
  viewsOrRoutines: string[];
};

async function main(): Promise<void> {
  const registry = await readMigrationRegistry();
  const directories = await listMigrationDirectories();
  const issues: string[] = [];
  const audits: MigrationAudit[] = [];

  for (const migration of directories) {
    const entry = registry[migration];

    if (!entry) {
      issues.push(`${migration}: missing migration registry entry.`);
      continue;
    }

    const sql = await readMigrationSql(migration);
    const riskFlags = collectRiskFlags(sql);
    const views = collectCreatedViews(sql);
    const routines = collectCreatedRoutines(sql);
    const localIssues = [...validateRegistryEntryShape(migration, entry)];

    for (const environment of F8_CONFIG.expectedMigrationEnvironments) {
      if (!entry.environments.includes(environment)) {
        localIssues.push(`${migration}: missing environment '${environment}'.`);
      }
    }

    if (riskFlags.length > 0 && !entry.strategy.expandContract) {
      localIssues.push(`${migration}: risky operations require expand-contract strategy.`);
    }

    if (riskFlags.some((flag) => flag === "bulk_delete" || flag === "bulk_update") && !entry.strategy.batching.required) {
      localIssues.push(`${migration}: bulk data changes require a documented batching strategy.`);
    }

    if ((views.length > 0 || routines.length > 0) && !entry.validation.viewsAndRoutinesReviewed) {
      localIssues.push(`${migration}: views/routines were created without explicit RLS review evidence.`);
    }

    if (containsRlsDisable(sql)) {
      localIssues.push(`${migration}: disabling RLS during a migration is forbidden.`);
    }

    if (!entry.validation.rollbackTested) {
      localIssues.push(`${migration}: rollback validation is still marked as false.`);
    }

    audits.push({
      issues: localIssues,
      migration,
      riskFlags,
      viewsOrRoutines: [...views, ...routines]
    });
    issues.push(...localIssues);
  }

  for (const migrationName of Object.keys(registry)) {
    if (!directories.includes(migrationName)) {
      issues.push(`${migrationName}: registry entry exists but migration directory is missing.`);
    }
  }

  const report = {
    checkedAt: new Date().toISOString(),
    issues,
    migrations: audits,
    ok: issues.length === 0
  };

  const text = [
    `Migration governance check: ${report.ok ? "PASS" : "FAIL"}`,
    ...audits.map((audit) => {
      const prefix = audit.issues.length === 0 ? "PASS" : "FAIL";
      return `${prefix} ${audit.migration} :: risks=${audit.riskFlags.join(",") || "none"} :: findings=${audit.issues.length}`;
    }),
    ...(issues.length === 0 ? [] : ["", ...issues])
  ].join("\n");

  const jsonPath = await writeJsonReport("f8/migration-governance-report.json", report);
  const txtPath = await writeTextReport("f8/migration-governance-report.txt", text);

  logger.info(`${text}\n\nArtifacts:\n- ${jsonPath}\n- ${txtPath}`);

  if (!report.ok) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  logger.error(error);
  process.exitCode = 1;
});
