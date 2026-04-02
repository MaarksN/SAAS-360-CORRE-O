import { execSync } from "node:child_process";

function run(command) {
  return execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function tryRun(command) {
  try {
    return run(command);
  } catch {
    return "";
  }
}

function getDiffRange() {
  const baseRef = process.env.GITHUB_BASE_REF;

  if (baseRef) {
    tryRun(`git fetch --no-tags --depth=1 origin ${baseRef}`);
    return `origin/${baseRef}...HEAD`;
  }

  const hasParent = tryRun("git rev-parse --verify HEAD^1");
  if (hasParent) {
    return "HEAD^1..HEAD";
  }

  return "HEAD";
}

function parsePathFromNameStatusLine(line) {
  const parts = line.split("\t");
  const status = parts[0] ?? "";

  if (status.startsWith("R") || status.startsWith("C")) {
    return {
      path: parts[2] ?? "",
      status
    };
  }

  return {
    path: parts[1] ?? "",
    status
  };
}

const range = getDiffRange();
const changed = tryRun(`git diff --name-status ${range}`)
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map(parsePathFromNameStatusLine);

const frozenRoots = ["agents/", ".github/agents/", "packages/agents/"];

const violatingChanges = changed.filter(({ path, status }) => {
  if (!(status.startsWith("A") || status.startsWith("R") || status.startsWith("C"))) {
    return false;
  }

  return frozenRoots.some((root) => path.startsWith(root));
});

if (violatingChanges.length > 0) {
  console.error("Agent surface freeze violation detected.");
  console.error("New files must be created only under packages/agent-packs/.");
  for (const change of violatingChanges) {
    console.error(` - ${change.status}\t${change.path}`);
  }
  process.exitCode = 1;
} else {
  console.log("Agent surface freeze check passed.");
}
