import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { projectRoot } from "../ci/shared.mjs";

const reportPath = path.join(projectRoot, "docs", "evidence", "performance-report.md");
const artifactDir = path.join(projectRoot, "artifacts", "performance");
const k6SummaryPath = path.join(artifactDir, "k6", "cycle-08-stress-summary.txt");
const workerSummaryPath = path.join(artifactDir, "worker-overload.json");
const databaseBaselinePath = path.join(artifactDir, "database-baseline.json");

mkdirSync(path.dirname(reportPath), { recursive: true });

function hasArtifact(filePath) {
  return existsSync(filePath);
}

const lines = [
  "# Performance Report",
  "",
  `- Generated at: ${new Date().toISOString()}`,
  "- Acceptance target: p99 <= 500ms for critical API paths",
  "",
  "## Collected Artifacts",
  "",
  `- K6 load test: ${hasArtifact(k6SummaryPath) ? "present" : "pending"} (${path.relative(projectRoot, k6SummaryPath)})`,
  `- Worker overload summary: ${hasArtifact(workerSummaryPath) ? "present" : "pending"} (${path.relative(projectRoot, workerSummaryPath)})`,
  `- Database baseline: ${hasArtifact(databaseBaselinePath) ? "present" : "pending"} (${path.relative(projectRoot, databaseBaselinePath)})`,
  "",
  "## Execution Sources",
  "",
  "- Load test runner: scripts/load-tests/stress.js",
  "- Worker overload runner: scripts/load-tests/worker-overload.ts",
  "- Database baseline source: apps/api/test/performance.test.ts",
  "",
  "## Notes",
  "",
  "- Chaos, resilience and soak lanes are environment-backed and should publish into artifacts/performance during release candidate validation.",
  "- This report intentionally stays file-backed so each RC can attach raw evidence alongside the markdown summary."
];

writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");