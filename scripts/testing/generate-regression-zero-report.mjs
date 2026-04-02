import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { projectRoot } from "../ci/shared.mjs";

const traceabilityPath = path.join(projectRoot, "scripts", "testing", "traceability-data.json");
const coverageSummaryPath = path.join(projectRoot, "artifacts", "coverage", "summary.json");
const reportPath = path.join(projectRoot, "docs", "evidence", "regression-zero.md");
const traceability = JSON.parse(readFileSync(traceabilityPath, "utf8"));
const criticalFlowCount = traceability.modules.reduce((total, moduleEntry) => total + moduleEntry.flows.length, 0);
const criticalRegressionCount = traceability.criticalRegressions.length;
const coverageSummary = existsSync(coverageSummaryPath) ? JSON.parse(readFileSync(coverageSummaryPath, "utf8")) : null;

mkdirSync(path.dirname(reportPath), { recursive: true });

const lines = [
  "# Regression Zero Report",
  "",
  `- Generated at: ${new Date().toISOString()}`,
  `- Critical flows mapped: ${criticalFlowCount}`,
  `- Critical regressions guarded: ${criticalRegressionCount}`,
  `- Coverage dashboard: ${coverageSummary ? "present" : "pending"}`,
  "",
  "## Evidence Summary",
  "",
  coverageSummary ? `- Coverage gate status: ${coverageSummary.ok ? "PASS" : "FAIL"}` : "- Coverage gate status: pending",
  "- Traceability matrix: docs/testing/F5_TRACEABILITY.md",
  "- Performance report: docs/evidence/performance-report.md",
  "",
  "## Guard Rails",
  "",
  "- Critical regressions are mapped to explicit guard tests in scripts/testing/traceability-data.json.",
  "- Coverage ratchet is enforced via scripts/coverage/check.mjs and baseline.json.",
  "- Package shards and tagged suites publish duration evidence into artifacts/testing."
];

writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");