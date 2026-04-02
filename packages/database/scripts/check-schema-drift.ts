import { getPrismaBinaryPath, runCommand } from "./lib/process.js";
import { schemaPath } from "./lib/paths.js";
import { writeJsonReport, writeTextReport } from "./lib/report.js";
import { createLogger } from "@birthub/logger";

const logger = createLogger("db-check-schema-drift");

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    const report = {
      checkedAt: new Date().toISOString(),
      ok: true,
      skipped: true,
      reason: "DATABASE_URL is not configured."
    };

    const jsonPath = await writeJsonReport("f8/schema-drift-report.json", report);
    const txtPath = await writeTextReport(
      "f8/schema-drift-report.txt",
      "Schema drift check skipped because DATABASE_URL is not configured."
    );

    logger.info(`Schema drift check skipped.\nArtifacts:\n- ${jsonPath}\n- ${txtPath}`);
    return;
  }

  const prismaBinary = getPrismaBinaryPath();
  const args = [
    "migrate",
    "diff",
    "--exit-code",
    "--from-url",
    process.env.DATABASE_URL,
    "--to-schema-datamodel",
    schemaPath
  ];

  if (process.env.SHADOW_DATABASE_URL) {
    args.push("--shadow-database-url", process.env.SHADOW_DATABASE_URL);
  }

  const result = await runCommand(prismaBinary, args);
  const ok = result.code === 0;
  const report = {
    checkedAt: new Date().toISOString(),
    ok,
    output: result.output,
    skipped: false
  };

  const text = ok
    ? "Schema drift check: PASS"
    : `Schema drift check: FAIL\n\n${result.output.trim()}`;
  const jsonPath = await writeJsonReport("f8/schema-drift-report.json", report);
  const txtPath = await writeTextReport("f8/schema-drift-report.txt", text);

  logger.info(`${text}\n\nArtifacts:\n- ${jsonPath}\n- ${txtPath}`);

  if (!ok) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  logger.error(error);
  process.exitCode = 1;
});
