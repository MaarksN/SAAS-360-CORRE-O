import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

import { buildEnv, projectRoot } from "../ci/shared.mjs";

const quarantinePath = path.join(projectRoot, "scripts", "testing", "flaky-quarantine.json");
const quarantine = JSON.parse(readFileSync(quarantinePath, "utf8"));
const category = process.argv[2];
const supportedCategories = new Set(["unit", "integration", "slow"]);
const categoryTimeouts = {
  integration: 30000,
  slow: 120000,
  unit: 5000
};

if (!supportedCategories.has(category)) {
  throw new Error(`Unknown tag '${category}'. Expected one of: ${Array.from(supportedCategories).join(", ")}`);
}

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if ([".git", ".next", ".turbo", "coverage", "dist", "node_modules", "test-results", "artifacts"].includes(entry.name)) {
        continue;
      }
      files.push(...walk(fullPath));
      continue;
    }
    if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function normalize(filePath) {
  return path.relative(projectRoot, filePath).replaceAll("\\", "/");
}

function classify(filePath) {
  const normalized = normalize(filePath);
  if (normalized.includes("/e2e/")) {
    return "e2e";
  }
  if (
    normalized.includes(".contract.test.") ||
    normalized.includes(".integration.test.") ||
    normalized.includes(".db-integration.test.") ||
    normalized.startsWith("apps/api/tests/") ||
    normalized.startsWith("apps/api/test/") ||
    normalized.startsWith("apps/worker/test/") ||
    normalized.startsWith("apps/web/tests/")
  ) {
    return "integration";
  }
  if (
    normalized.includes("benchmark") ||
    normalized.includes("performance") ||
    normalized.includes("load/") ||
    normalized.includes("runner.agent.smoke") ||
    normalized.includes("smoke.test.")
  ) {
    return "slow";
  }
  return "unit";
}

const quarantined = new Set((quarantine.files ?? []).map((file) => file.replaceAll("\\", "/")));
const allTestFiles = walk(projectRoot).map(normalize);
const selectedFiles = allTestFiles
  .filter((file) => !quarantined.has(file))
  .filter((file) => classify(file) === category)
  .sort();

mkdirSync(path.join(projectRoot, "artifacts", "testing", "tags"), { recursive: true });

if (selectedFiles.length === 0) {
  const emptySummary = { category, completedAt: new Date().toISOString(), durationMs: 0, files: [] };
  writeFileSync(path.join(projectRoot, "artifacts", "testing", "tags", `${category}.json`), `${JSON.stringify(emptySummary, null, 2)}\n`, "utf8");
  process.exit(0);
}

const startedAt = Date.now();
const args = [
  "--import",
  "tsx",
  `--test-timeout=${categoryTimeouts[category]}`,
  "--test-reporter=spec",
  "--test",
  ...selectedFiles
];

const result = spawnSync(process.execPath, args, {
  cwd: projectRoot,
  encoding: "utf8",
  env: buildEnv(),
  stdio: "pipe"
});

process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");

const summary = {
  category,
  completedAt: new Date().toISOString(),
  durationMs: Date.now() - startedAt,
  files: selectedFiles,
  timeoutMs: categoryTimeouts[category]
};

const basePath = path.join(projectRoot, "artifacts", "testing", "tags", category);
const markdown = [
  `# Tagged Test Run: ${category}`,
  "",
  `- Completed at: ${summary.completedAt}`,
  `- Duration: ${summary.durationMs}ms`,
  `- Timeout per run: ${summary.timeoutMs}ms`,
  `- Files: ${summary.files.length}`,
  "",
  ...summary.files.map((file) => `- ${file}`)
].join("\n");

writeFileSync(`${basePath}.json`, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
writeFileSync(`${basePath}.md`, `${markdown}\n`, "utf8");

if ((result.status ?? 1) !== 0) {
  process.exitCode = result.status ?? 1;
}