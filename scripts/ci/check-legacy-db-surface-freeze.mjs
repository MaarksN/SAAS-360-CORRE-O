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

function isAllowedPath(path) {
  const normalizedPath = path.replace(/\\/g, "/");

  if (normalizedPath.startsWith("docs/")) {
    return true;
  }

  if (normalizedPath.startsWith("artifacts/")) {
    return true;
  }

  if (normalizedPath.startsWith("audit/")) {
    return true;
  }

  if (normalizedPath.startsWith("scripts/diagnostics/")) {
    return true;
  }

  if (normalizedPath.startsWith("scripts/")) {
    return true;
  }

  if (normalizedPath.startsWith("packages/db/")) {
    return true;
  }

  if (normalizedPath === "eslint.config.mjs") {
    return true;
  }

  return false;
}

const rawMatches = safeRun('git grep -n -I -E "@birthub/db|packages/db" -- apps packages');

if (!rawMatches) {
  console.log("Legacy DB surface freeze check passed (no matches found).");
  process.exit(0);
}

const lines = rawMatches
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const violations = lines.filter((line) => {
  const separatorIndex = line.indexOf(":");
  if (separatorIndex < 0) {
    return true;
  }

  const path = line.slice(0, separatorIndex);
  return !isAllowedPath(path);
});

if (violations.length > 0) {
  console.error("Legacy DB surface freeze violation detected.");
  console.error("Only non-runtime governance artifacts (docs/artifacts/audit/scripts) and packages/db compatibility layer may reference '@birthub/db' or 'packages/db'.");
  for (const violation of violations) {
    console.error(` - ${violation}`);
  }
  process.exit(1);
}

console.log(`Legacy DB surface freeze check passed (${lines.length} allowed reference(s)).`);
