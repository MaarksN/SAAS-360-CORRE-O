import { hasIndexCoverage, parsePrismaSchema } from "./lib/prisma-schema.js";
import { writeJsonReport, writeTextReport } from "./lib/report.js";
import { createLogger } from "@birthub/logger";

const logger = createLogger("db-check-fk-indexes");

type ForeignKeyFinding = {
  fields: string[];
  issues: string[];
  model: string;
  relationField: string;
};

async function main(): Promise<void> {
  const models = await parsePrismaSchema();
  const findings: ForeignKeyFinding[] = [];
  const issues: string[] = [];

  for (const model of models) {
    for (const relationField of model.fields.filter((field) => field.relationFields.length > 0)) {
      const relationIssues: string[] = [];

      if (!hasIndexCoverage(model, relationField.relationFields)) {
        relationIssues.push(
          `${model.name}.${relationField.name}: missing index coverage for FK fields [${relationField.relationFields.join(", ")}].`
        );
      }

      findings.push({
        fields: relationField.relationFields,
        issues: relationIssues,
        model: model.name,
        relationField: relationField.name
      });
      issues.push(...relationIssues);
    }
  }

  const report = {
    checkedAt: new Date().toISOString(),
    findings,
    issues,
    ok: issues.length === 0
  };

  const text = [
    `FK index audit: ${report.ok ? "PASS" : "FAIL"}`,
    ...findings.map((finding) => `${finding.issues.length === 0 ? "PASS" : "FAIL"} ${finding.model}.${finding.relationField}`),
    ...(issues.length === 0 ? [] : ["", ...issues])
  ].join("\n");

  const jsonPath = await writeJsonReport("f8/fk-index-report.json", report);
  const txtPath = await writeTextReport("f8/fk-index-report.txt", text);

  logger.info(`${text}\n\nArtifacts:\n- ${jsonPath}\n- ${txtPath}`);

  if (!report.ok) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  logger.error(error);
  process.exitCode = 1;
});
