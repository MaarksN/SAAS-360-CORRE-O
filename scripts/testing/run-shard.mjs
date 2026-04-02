import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { capturePnpm, projectRoot } from "../ci/shared.mjs";

const shards = {
  api: ["@birthub/api"],
  "api-gateway": ["@birthub/api-gateway"],
  worker: ["@birthub/worker"],
  ui: ["@birthub/web", "@birthub/dashboard", "@birthub/voice-engine"],
  packages: [
    "@birthub/agent-packs",
    "@birthub/agent-runtime",
    "@birthub/agents-core",
    "@birthub/agents-registry",
    "@birthub/auth",
    "@birthub/config",
    "@birthub/conversation-core",
    "@birthub/database",
    "@birthub/db",
    "@birthub/emails",
    "@birthub/integrations",
    "@birthub/llm-client",
    "@birthub/logger",
    "@birthub/queue",
    "@birthub/security",
    "@birthub/shared",
    "@birthub/shared-types",
    "@birthub/testing",
    "@birthub/utils",
    "@birthub/workflows-core",
    "orchestrator-worker"
  ]
};

const shardId = process.argv[2];
if (!shardId || !(shardId in shards)) {
  throw new Error(`Unknown shard '${shardId}'. Expected one of: ${Object.keys(shards).join(", ")}`);
}

const packages = shards[shardId];
const startedAt = Date.now();
const runs = [];
let exitCode = 0;

mkdirSync(path.join(projectRoot, "artifacts", "testing", "shards"), { recursive: true });

for (const packageName of packages) {
  const packageStartedAt = Date.now();
  const result = capturePnpm(["--filter", packageName, "test"], { cwd: projectRoot });
  const durationMs = Date.now() - packageStartedAt;
  const ok = (result.status ?? 1) === 0;

  runs.push({ durationMs, ok, packageName });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");

  if (!ok) {
    exitCode = result.status ?? 1;
    break;
  }
}

const summary = {
  completedAt: new Date().toISOString(),
  durationMs: Date.now() - startedAt,
  packages: runs,
  shardId
};

const targetBase = path.join(projectRoot, "artifacts", "testing", "shards", shardId);
const markdown = [
  `# Test Shard ${shardId}`,
  "",
  `- Completed at: ${summary.completedAt}`,
  `- Duration: ${summary.durationMs}ms`,
  "",
  "| Package | Status | Duration (ms) |",
  "| --- | --- | ---: |",
  ...summary.packages.map((entry) => `| ${entry.packageName} | ${entry.ok ? "PASS" : "FAIL"} | ${entry.durationMs} |`)
].join("\n");

writeFileSync(`${targetBase}.json`, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
writeFileSync(`${targetBase}.md`, `${markdown}\n`, "utf8");

if (exitCode !== 0) {
  process.exitCode = exitCode;
}