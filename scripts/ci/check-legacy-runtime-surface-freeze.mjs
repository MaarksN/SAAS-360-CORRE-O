import { execSync } from "node:child_process";

function run(command) {
  return execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function safeRun(command) {
  try {
    return run(command);
  } catch {
    return "";
  }
}

function getDiffRange() {
  const baseRef = process.env.GITHUB_BASE_REF;

  if (baseRef) {
    safeRun(`git fetch --no-tags --depth=1 origin ${baseRef}`);
    return `origin/${baseRef}...HEAD`;
  }

  const hasParent = safeRun("git rev-parse --verify HEAD^1");
  if (hasParent) {
    return "HEAD^1..HEAD";
  }

  return "HEAD";
}

function parseNameStatus(line) {
  const parts = line.split("\t");
  const status = parts[0] ?? "";

  if (status.startsWith("R") || status.startsWith("C")) {
    return {
      fromPath: parts[1] ?? "",
      path: parts[2] ?? "",
      status
    };
  }

  return {
    fromPath: "",
    path: parts[1] ?? "",
    status
  };
}

const legacyRoots = ["apps/api-gateway/", "apps/agent-orchestrator/", "apps/legacy/dashboard/"];
const diffRange = getDiffRange();
const changed = safeRun(`git diff --name-status ${diffRange}`)
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map(parseNameStatus);

const violations = changed.filter(({ fromPath, path, status }) => {
  if (!(status.startsWith("A") || status.startsWith("R") || status.startsWith("C"))) {
    return false;
  }

  if (
    status.startsWith("R") &&
    fromPath.startsWith("apps/dashboard/") &&
    path.startsWith("apps/legacy/dashboard/")
  ) {
    return false;
  }

  return legacyRoots.some((root) => path.startsWith(root));
});

if (violations.length > 0) {
  console.error("Legacy runtime surface freeze violation detected.");
  console.error("New files under apps/api-gateway, apps/agent-orchestrator or apps/legacy/dashboard are blocked.");
  console.error("Use canonical runtime surfaces (apps/api, apps/worker, apps/web) or document/approve exception explicitly.");
  for (const violation of violations) {
    console.error(` - ${violation.status}\t${violation.path}`);
  }
  process.exit(1);
}

console.log("Legacy runtime surface freeze check passed.");
