import { workspaceRoot } from "./lib/paths.js";
import { collectRepoTextFiles } from "./lib/repo-scan.js";
import { writeJsonReport, writeTextReport } from "./lib/report.js";
import { createLogger } from "@birthub/logger";

const logger = createLogger("db-check-raw-query-joins");

type QueryJoinFinding = {
  issues: string[];
  path: string;
};

function shouldInspect(relativePath: string): boolean {
  if (relativePath.startsWith("packages/database/prisma/migrations/")) {
    return false;
  }

  const inScopeRoot =
    relativePath.startsWith("apps/api/") ||
    relativePath.startsWith("packages/database/") ||
    relativePath.startsWith("scripts/");

  if (!inScopeRoot) {
    return false;
  }

  return /\.(cjs|cts|js|mjs|mts|sql|ts)$/i.test(relativePath);
}

async function main(): Promise<void> {
  const files = (await collectRepoTextFiles(workspaceRoot)).filter((file) => shouldInspect(file.relativePath));
  const findings: QueryJoinFinding[] = [];
  const issues: string[] = [];

  for (const file of files) {
    const hasJoin = /\bJOIN\b/i.test(file.content);
    const hasPrismaRawCall = /\$(queryRaw|executeRaw)/i.test(file.content);
    const hasSqlJoinPattern = /\bSELECT\b[\s\S]{0,600}\bFROM\b[\s\S]{0,600}\bJOIN\b/i.test(file.content);
    const isRawSql = hasPrismaRawCall || hasSqlJoinPattern;

    if (!hasJoin || !isRawSql) {
      continue;
    }

    const localIssues: string[] = [];
    const hasTenantFilter = /(tenantId|tenant_id|get_current_tenant_id|app\.current_tenant_id)/i.test(file.content);

    if (!hasTenantFilter) {
      localIssues.push(`${file.relativePath}: JOIN detected without an explicit tenant filter marker.`);
    }

    findings.push({
      issues: localIssues,
      path: file.relativePath
    });
    issues.push(...localIssues);
  }

  const report = {
    checkedAt: new Date().toISOString(),
    findings,
    issues,
    ok: issues.length === 0
  };

  const text = [
    `Raw JOIN audit: ${report.ok ? "PASS" : "FAIL"}`,
    ...findings.map((finding) => `${finding.issues.length === 0 ? "PASS" : "FAIL"} ${finding.path}`),
    ...(issues.length === 0 ? [] : ["", ...issues])
  ].join("\n");

  const jsonPath = await writeJsonReport("f8/raw-join-audit-report.json", report);
  const txtPath = await writeTextReport("f8/raw-join-audit-report.txt", text);

  logger.info(`${text}\n\nArtifacts:\n- ${jsonPath}\n- ${txtPath}`);

  if (!report.ok) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  logger.error(error);
  process.exitCode = 1;
});
