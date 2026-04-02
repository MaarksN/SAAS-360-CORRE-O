import { F8_CONFIG } from "../f8.config.js";
import { createPrismaClient } from "../src/client.js";
import { writeJsonReport, writeTextReport } from "./lib/report.js";
import { createLogger } from "@birthub/logger";

const logger = createLogger("db-analyze-performance");

type SlowQueryRow = {
  calls: bigint | number;
  mean_exec_time: number;
  query: string;
  total_exec_time: number;
};

type UnusedIndexRow = {
  index_name: string;
  table_name: string;
};

type TableOptionRow = {
  relname: string;
  reloptions: string[] | null;
};

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    const report = {
      checkedAt: new Date().toISOString(),
      ok: true,
      reason: "DATABASE_URL is not configured.",
      skipped: true
    };

    const jsonPath = await writeJsonReport("f8/performance-report.json", report);
    const txtPath = await writeTextReport(
      "f8/performance-report.txt",
      "Performance audit skipped because DATABASE_URL is not configured."
    );

    logger.info(`Performance audit skipped.\nArtifacts:\n- ${jsonPath}\n- ${txtPath}`);
    return;
  }

  const prisma = createPrismaClient();

  try {
    let topSlowQueries: SlowQueryRow[] = [];
    let unusedIndexes: UnusedIndexRow[] = [];
    let tableOptions: TableOptionRow[] = [];
    const issues: string[] = [];

    try {
      topSlowQueries = await prisma.$queryRawUnsafe<SlowQueryRow[]>(`
        SELECT query, calls, total_exec_time, mean_exec_time
        FROM pg_stat_statements
        ORDER BY mean_exec_time DESC
        LIMIT 20
      `);
    } catch (error) {
      issues.push(`pg_stat_statements unavailable: ${error instanceof Error ? error.message : String(error)}`);
    }

    unusedIndexes = await prisma.$queryRawUnsafe<UnusedIndexRow[]>(`
      SELECT indexrelname AS index_name, relname AS table_name
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
        AND indexrelname NOT LIKE '%_pkey'
      ORDER BY relname ASC, indexrelname ASC
    `);

    tableOptions = await prisma.$queryRawUnsafe<TableOptionRow[]>(`
      SELECT relname, reloptions
      FROM pg_class
      WHERE relname = ANY($1)
      ORDER BY relname ASC
    `, [...F8_CONFIG.highWriteTables]);

    for (const table of F8_CONFIG.highWriteTables) {
      const config = tableOptions.find((row) => row.relname === table);
      const optionString = (config?.reloptions ?? []).join(",");
      if (!optionString.includes("autovacuum_vacuum_scale_factor") || !optionString.includes("autovacuum_analyze_scale_factor")) {
        issues.push(`${table}: missing aggressive autovacuum table-level settings.`);
      }
    }

    if (unusedIndexes.length > 0) {
      issues.push(`Unused indexes detected: ${unusedIndexes.length}.`);
    }

    const report = {
      checkedAt: new Date().toISOString(),
      issues,
      ok: issues.length === 0,
      topSlowQueries,
      unusedIndexes,
      highWriteTableOptions: tableOptions
    };

    const text = [
      `Performance audit: ${report.ok ? "PASS" : "FAIL"}`,
      `Top slow queries collected: ${topSlowQueries.length}`,
      `Unused indexes: ${unusedIndexes.length}`,
      ...tableOptions.map((row) => `${row.relname}: ${(row.reloptions ?? []).join(",") || "default"}`),
      ...(issues.length === 0 ? [] : ["", ...issues])
    ].join("\n");

    const jsonPath = await writeJsonReport("f8/performance-report.json", report);
    const txtPath = await writeTextReport("f8/performance-report.txt", text);

    logger.info(`${text}\n\nArtifacts:\n- ${jsonPath}\n- ${txtPath}`);

    if (!report.ok) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  logger.error(error);
  process.exitCode = 1;
});
