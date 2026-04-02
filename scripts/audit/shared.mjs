import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(scriptDir, "..", "..");
export const auditRoot = path.join(repoRoot, "audit");
export const defaultBackupRoot = path.resolve(
  repoRoot,
  "..",
  "..",
  "BirthHub360-pre-audit-backup-20260327"
);

const binaryExtensions = new Set([
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".pdf",
  ".png",
  ".svg",
  ".webp",
  ".zip"
]);

const rootHistoricalFiles = new Set([
  "agents_lint.txt",
  "lint_audit.txt",
  "lint_audit_after.txt",
  "logger_lint.txt",
  "web_lint.txt",
  "worker_lint.txt",
  "workflows_lint.txt"
]);

const configFileNames = new Set([
  ".dockerignore",
  ".env.example",
  ".env.production.mock",
  ".env.staging.mock",
  ".env.vps.example",
  ".gitattributes",
  ".gitignore",
  ".gitleaks.toml",
  ".lintstagedrc.json",
  ".nvmrc",
  ".python-version",
  "commitlint.config.cjs",
  "docker-compose.prod.yml",
  "docker-compose.yml",
  "eslint.config.mjs",
  "package.json",
  "playwright.config.ts",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "prettier.config.cjs",
  "pytest.ini",
  "tsconfig.base.json",
  "tsconfig.json",
  "turbo.json"
]);

export function toPosix(inputPath) {
  return inputPath.replace(/\\/g, "/");
}

export function fromRepo(relativePath) {
  return path.join(repoRoot, relativePath);
}

export function relativeToAbsolute(relativePath) {
  return path.join(repoRoot, relativePath);
}

export function pathExists(targetPath) {
  return existsSync(targetPath);
}

export function ensureDirectory(targetPath) {
  return fs.mkdir(targetPath, { recursive: true });
}

export async function resetDirectory(targetPath) {
  await fs.rm(targetPath, { force: true, recursive: true });
  await fs.mkdir(targetPath, { recursive: true });
}

export async function writeJson(targetPath, value) {
  await ensureDirectory(path.dirname(targetPath));
  await fs.writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function writeText(targetPath, value) {
  await ensureDirectory(path.dirname(targetPath));
  await fs.writeFile(targetPath, value, "utf8");
}

export function runGit(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8"
  }).trim();
}

export function listTrackedExistingFiles() {
  const output = runGit(["ls-files"]);
  return output
    .split(/\r?\n/)
    .map((line) => toPosix(line.trim()))
    .filter(Boolean)
    .filter((relativePath) => pathExists(fromRepo(relativePath)));
}

export async function sha256File(targetPath) {
  const buffer = await fs.readFile(targetPath);
  return createHash("sha256").update(buffer).digest("hex");
}

export function isHistoricalPath(relativePath) {
  return (
    relativePath.startsWith("audit/") ||
    relativePath.startsWith("docs/programs/12-ciclos/") ||
    relativePath === "docs/roadmap.md" ||
    rootHistoricalFiles.has(relativePath)
  );
}

export function isTestPath(relativePath) {
  return (
    relativePath.includes("/__tests__/") ||
    relativePath.includes("/tests/") ||
    relativePath.includes("/test/") ||
    relativePath.endsWith(".test.ts") ||
    relativePath.endsWith(".test.tsx") ||
    relativePath.endsWith(".spec.ts") ||
    relativePath.endsWith(".spec.tsx") ||
    relativePath.endsWith(".test.py")
  );
}

export function classifyKind(relativePath) {
  const baseName = path.posix.basename(relativePath);

  if (isHistoricalPath(relativePath)) {
    return "historical";
  }

  if (relativePath.startsWith("artifacts/")) {
    return "artifact";
  }

  if (isTestPath(relativePath)) {
    return "test";
  }

  if (
    relativePath.startsWith("infra/") ||
    relativePath.startsWith("ops/") ||
    relativePath.startsWith(".github/workflows/") ||
    baseName.startsWith("Dockerfile") ||
    baseName === "docker-compose.yml" ||
    baseName === "docker-compose.prod.yml"
  ) {
    return "infra";
  }

  if (
    configFileNames.has(baseName) ||
    baseName === "pyproject.toml" ||
    baseName.endsWith(".config.ts") ||
    baseName.endsWith(".config.js") ||
    baseName.endsWith(".config.mjs") ||
    baseName.endsWith(".config.cjs") ||
    baseName.endsWith(".tfvars.example")
  ) {
    return "config";
  }

  if (
    relativePath.startsWith("docs/") ||
    baseName.endsWith(".md") ||
    baseName.endsWith(".html") ||
    baseName.endsWith(".csv")
  ) {
    return "doc";
  }

  return "runtime";
}

export function detectLanguage(relativePath) {
  const extension = path.posix.extname(relativePath).toLowerCase();

  if (extension === ".ts" || extension === ".tsx") {
    return "TypeScript";
  }

  if (extension === ".js" || extension === ".mjs" || extension === ".cjs") {
    return "JavaScript";
  }

  if (extension === ".py") {
    return "Python";
  }

  if (extension === ".sql") {
    return "SQL";
  }

  if (extension === ".json") {
    return "JSON";
  }

  if (extension === ".yaml" || extension === ".yml") {
    return "YAML";
  }

  if (extension === ".toml") {
    return "TOML";
  }

  if (extension === ".md") {
    return "Markdown";
  }

  if (extension === ".html") {
    return "HTML";
  }

  if (extension === ".sh" || extension === ".ps1") {
    return "Shell";
  }

  if (extension === ".tf") {
    return "Terraform";
  }

  return extension ? extension.slice(1).toUpperCase() : "Unknown";
}

export function shouldIncludeEvidence(kind) {
  return kind === "runtime" || kind === "test" || kind === "infra" || kind === "config";
}

export async function readTextFile(relativePath) {
  const extension = path.posix.extname(relativePath).toLowerCase();
  if (binaryExtensions.has(extension)) {
    return null;
  }

  const buffer = await fs.readFile(fromRepo(relativePath));
  if (buffer.includes(0)) {
    return null;
  }

  return buffer.toString("utf8");
}

export function countMatches(input, regex) {
  const matches = input.match(regex);
  return matches ? matches.length : 0;
}

export function listMatches(input, regex) {
  const values = new Set();

  for (const match of input.matchAll(regex)) {
    const captured = match[1] ?? match[2];
    if (captured) {
      values.add(String(captured).trim());
    }
  }

  return Array.from(values).sort();
}

export function getTopLevel(relativePath) {
  const [topLevel] = relativePath.split("/");
  return topLevel ?? "_root";
}

export function analysisOutputPath(relativePath) {
  if (!relativePath.includes("/")) {
    return toPosix(path.join("audit", "files_analysis", "_root", `${path.basename(relativePath)}.md`));
  }

  return toPosix(path.join("audit", "files_analysis", `${relativePath}.md`));
}

export function summarizeList(values, limit = 8) {
  if (values.length === 0) {
    return "none";
  }

  if (values.length <= limit) {
    return values.join(", ");
  }

  return `${values.slice(0, limit).join(", ")}, +${values.length - limit} more`;
}

export function truncateOutput(input, limit = 6000) {
  if (input.length <= limit) {
    return input;
  }

  return `${input.slice(0, limit)}\n...[truncated]`;
}

export function runCommand(command, args, options = {}) {
  const sharedOptions = {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: options.timeoutMs ?? 180000,
    env: {
      ...process.env,
      ...(options.env ?? {})
    }
  };
  const result =
    process.platform === "win32"
      ? spawnSync(
          [command, ...args]
            .map((value) => (/\s/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value))
            .join(" "),
          {
            ...sharedOptions,
            shell: true
          }
        )
      : spawnSync(command, args, {
          ...sharedOptions,
          shell: false
        });

  return {
    command: [command, ...args].join(" "),
    exitCode: result.status ?? (result.error ? 1 : 0),
    signal: result.signal ?? null,
    stderr: truncateOutput(
      [result.stderr ?? "", result.error ? String(result.error.message ?? result.error) : ""]
        .filter(Boolean)
        .join("\n")
    ),
    stdout: truncateOutput(result.stdout ?? "")
  };
}
