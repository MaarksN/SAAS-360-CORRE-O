import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { projectRoot } from "../ci/shared.mjs";

const dataPath = path.join(projectRoot, "scripts", "testing", "traceability-data.json");
const data = JSON.parse(readFileSync(dataPath, "utf8"));
const markdownPath = path.join(projectRoot, "docs", "testing", "F5_TRACEABILITY.md");
const artifactPath = path.join(projectRoot, "artifacts", "testing", "traceability.json");

for (const moduleEntry of data.modules) {
  for (const flow of moduleEntry.flows) {
    for (const testFile of flow.tests) {
      if (!existsSync(path.join(projectRoot, testFile))) {
        throw new Error(`Traceability report references missing test file: ${testFile}`);
      }
    }
  }
}

mkdirSync(path.dirname(markdownPath), { recursive: true });
mkdirSync(path.dirname(artifactPath), { recursive: true });

const lines = [
  "# F5 Traceability Matrix",
  "",
  `- Generated at: ${new Date().toISOString()}`,
  `- Source: ${data.generatedFrom}`,
  ""
];

for (const moduleEntry of data.modules) {
  lines.push(`## ${moduleEntry.title}`);
  lines.push("");
  lines.push(`- Threshold target: ${moduleEntry.threshold}%`);
  lines.push(`- Critical modules: ${moduleEntry.criticalModules.length}`);
  lines.push("");
  lines.push("| Critical flow | Test suites |");
  lines.push("| --- | --- |");
  for (const flow of moduleEntry.flows) {
    lines.push(`| ${flow.name} | ${flow.tests.join("<br>")} |`);
  }
  lines.push("");
  lines.push("Functional gaps:");
  for (const gap of moduleEntry.gaps) {
    lines.push(`- ${gap}`);
  }
  lines.push("");
}

lines.push("## Critical Regressions");
lines.push("");
lines.push("| Regression | Guard test |");
lines.push("| --- | --- |");
for (const regression of data.criticalRegressions) {
  lines.push(`| ${regression.id} | ${regression.tests.join("<br>")} |`);
}
lines.push("");
lines.push("## Functional vs Code Coverage Gaps");
lines.push("");
for (const gap of data.functionalCoverageGaps) {
  lines.push(`- ${gap}`);
}

writeFileSync(markdownPath, `${lines.join("\n")}\n`, "utf8");
writeFileSync(artifactPath, `${JSON.stringify({ ...data, generatedAt: new Date().toISOString() }, null, 2)}\n`, "utf8");