import {
  collectCreatedRoutines,
  collectCreatedViews,
  collectRlsEnabledTables,
  containsRlsDisable,
  listMigrationDirectories,
  readMigrationSql
} from "./lib/migrations.js";
import { getTenantScopedModels, hasIndexCoverage, parsePrismaSchema } from "./lib/prisma-schema.js";
import { writeJsonReport, writeTextReport } from "./lib/report.js";
import { createLogger } from "@birthub/logger";

const logger = createLogger("db-check-tenancy-controls");

type TenancyFinding = {
  issues: string[];
  model: string;
  table: string;
};

async function main(): Promise<void> {
  const models = getTenantScopedModels(await parsePrismaSchema());
  const rlsTables = new Set<string>();
  const createdViews = new Set<string>();
  const createdRoutines = new Set<string>();
  const issues: string[] = [];

  for (const migration of await listMigrationDirectories()) {
    const sql = await readMigrationSql(migration);
    for (const table of collectRlsEnabledTables(sql)) {
      rlsTables.add(table);
    }

    for (const view of collectCreatedViews(sql)) {
      createdViews.add(view);
    }

    for (const routine of collectCreatedRoutines(sql)) {
      createdRoutines.add(routine);
    }

    if (containsRlsDisable(sql)) {
      issues.push(`${migration}: contains DISABLE ROW LEVEL SECURITY.`);
    }
  }

  const findings: TenancyFinding[] = models.map((model) => {
    const modelIssues: string[] = [];

    if (!hasIndexCoverage(model, ["tenantId"])) {
      modelIssues.push(`${model.name}: missing leading index coverage for tenantId.`);
    }

    if (!rlsTables.has(model.mappedName)) {
      modelIssues.push(`${model.name}: missing RLS policy for table '${model.mappedName}'.`);
    }

    return {
      issues: modelIssues,
      model: model.name,
      table: model.mappedName
    };
  });

  issues.push(...findings.flatMap((finding) => finding.issues));

  const report = {
    checkedAt: new Date().toISOString(),
    createdRoutines: Array.from(createdRoutines).sort(),
    createdViews: Array.from(createdViews).sort(),
    findings,
    issues,
    ok: issues.length === 0,
    rlsTables: Array.from(rlsTables).sort(),
    tenantScopedTables: models.map((model) => model.mappedName)
  };

  const text = [
    `Tenant isolation audit: ${report.ok ? "PASS" : "FAIL"}`,
    ...findings.map((finding) => `${finding.issues.length === 0 ? "PASS" : "FAIL"} ${finding.table}`),
    ...(issues.length === 0 ? [] : ["", ...issues])
  ].join("\n");

  const jsonPath = await writeJsonReport("f8/tenant-isolation-report.json", report);
  const txtPath = await writeTextReport("f8/tenant-isolation-report.txt", text);

  logger.info(`${text}\n\nArtifacts:\n- ${jsonPath}\n- ${txtPath}`);

  if (!report.ok) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  logger.error(error);
  process.exitCode = 1;
});
