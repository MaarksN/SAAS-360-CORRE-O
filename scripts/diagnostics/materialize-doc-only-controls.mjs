import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..", "..");
const normalize = (value) => value.replaceAll("\\", "/");
const readText = (relativePath) =>
  readFileSync(path.join(root, relativePath), "utf8");

const result = {
  generatedAt: new Date().toISOString(),
  checks: {},
  blockers: [],
  warnings: [],
};

function addCheck(name, status, details = {}) {
  result.checks[name] = { status, ...details };
  if (status === "fail") {
    result.blockers.push(name);
  }
  if (status === "warn") {
    result.warnings.push(name);
  }
}

function walkFiles(startRelativePath) {
  const startPath = path.join(root, startRelativePath);
  if (!existsSync(startPath)) return [];
  const queue = [startPath];
  const files = [];

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) continue;

    for (const entry of readdirSync(current)) {
      const absolute = path.join(current, entry);
      const stats = statSync(absolute);
      if (stats.isDirectory()) {
        if (["node_modules", ".git", "dist", ".next", ".turbo"].includes(entry)) {
          continue;
        }
        queue.push(absolute);
        continue;
      }
      files.push(absolute);
    }
  }

  return files;
}

function unquoteYamlScalar(value) {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

function parseBranchProtectionSettings(rawYaml) {
  const lines = rawYaml.split(/\r?\n/u);
  const branches = new Map();
  let currentBranch = null;
  let currentContextIndent = null;

  for (const line of lines) {
    const branchMatch = line.match(/^(\s*)-\s+name:\s+(.+?)\s*$/u);
    if (branchMatch) {
      const [, indent, rawName] = branchMatch;
      currentBranch = {
        contexts: [],
        indent: indent.length,
        name: unquoteYamlScalar(rawName),
        requiredApprovingReviewCount: null,
        strict: null
      };
      currentContextIndent = null;
      branches.set(currentBranch.name, currentBranch);
      continue;
    }

    if (!currentBranch) {
      continue;
    }

    const currentIndent = line.match(/^(\s*)/u)?.[1]?.length ?? 0;
    if (currentIndent <= currentBranch.indent && line.trim().length > 0) {
      currentBranch = null;
      currentContextIndent = null;
      continue;
    }

    const reviewCountMatch = line.match(/^\s*required_approving_review_count:\s*(\d+)\s*$/u);
    if (reviewCountMatch) {
      currentBranch.requiredApprovingReviewCount = Number(reviewCountMatch[1]);
      continue;
    }

    const strictMatch = line.match(/^\s*strict:\s*(true|false)\s*$/u);
    if (strictMatch) {
      currentBranch.strict = strictMatch[1] === "true";
      continue;
    }

    const contextsMatch = line.match(/^(\s*)contexts:\s*$/u);
    if (contextsMatch) {
      currentContextIndent = contextsMatch[1].length;
      continue;
    }

    if (currentContextIndent !== null) {
      if (currentIndent <= currentContextIndent && line.trim().length > 0) {
        currentContextIndent = null;
        continue;
      }

      const contextMatch = line.match(/^\s*-\s+(.+?)\s*$/u);
      if (contextMatch) {
        currentBranch.contexts.push(unquoteYamlScalar(contextMatch[1]));
      }
    }
  }

  return branches;
}

const packageJson = JSON.parse(readText("package.json"));
const nvmrc = readText(".nvmrc").trim();
const pythonVersion = readText(".python-version").trim();
const ciWorkflow = readText(".github/workflows/ci.yml");
const securityWorkflow = readText(".github/workflows/security-scan.yml");
const repositorySettings = readText(".github/settings.yml");
const f11ClosureMinutes = readText("docs/release/f11-closure-minutes-2026-03-22.md");
const f11ResidualRisk = readText("docs/release/f11-residual-risk-register-2026-03-22.md");
const workflowsDirectory = path.join(root, ".github", "workflows");
const workflowFiles = readdirSync(workflowsDirectory).filter((file) => file.endsWith(".yml"));
const f11LogsDir = path.join(root, "artifacts", "f11-closure-2026-03-22", "logs");

addCheck("codeowners-present", existsSync(path.join(root, ".github", "CODEOWNERS")) ? "pass" : "fail");

const requiredF11LogBases = [
  "01-install-rerun",
  "02-monorepo-doctor",
  "03-release-scorecard",
  "04-lint-core-rerun",
  "05-typecheck-core-rerun",
  "06-test-core-rerun",
  "07-test-isolation",
  "08-build-core-rerun",
  "09-test-e2e-release",
  "10-preflight-staging-rerun",
  "11-preflight-production-rerun",
  "12-workspace-audit",
  "13-security-report",
  "14-privacy-verify",
  "15-security-guardrails",
  "16-grep-legacy-db",
];

const missingF11Evidence = [];
for (const baseName of requiredF11LogBases) {
  const shaPathWithLogSuffix = path.join(f11LogsDir, `${baseName}.log.sha256`);
  const shaPathLegacySuffix = path.join(f11LogsDir, `${baseName}.sha256`);

  if (!existsSync(shaPathWithLogSuffix) && !existsSync(shaPathLegacySuffix)) {
    missingF11Evidence.push(`${baseName}.log.sha256|${baseName}.sha256`);
  }
}

addCheck(
  "f11-evidence-bundle-complete",
  missingF11Evidence.length === 0 ? "pass" : "fail",
  { missingF11Evidence },
);

const hasFrozenLockfile =
  ciWorkflow.includes("--frozen-lockfile") || securityWorkflow.includes("--frozen-lockfile");
addCheck("frozen-lockfile-in-workflows", hasFrozenLockfile ? "pass" : "fail");

const workflowTimeouts = [];
for (const file of workflowFiles) {
  const content = readText(`.github/workflows/${file}`);
  const hasTimeout = /timeout-minutes\s*:/.test(content);
  workflowTimeouts.push({ file, hasTimeout });
}
const missingTimeout = workflowTimeouts.filter((item) => !item.hasTimeout).map((item) => item.file);
addCheck(
  "workflow-timeouts",
  missingTimeout.length === 0 ? "pass" : "warn",
  { missingTimeout },
);

const protectedBranches = parseBranchProtectionSettings(repositorySettings);
const mainBranchProtection = protectedBranches.get("main");
const developBranchProtection = protectedBranches.get("develop");
const hasMainBranchProtection =
  mainBranchProtection?.requiredApprovingReviewCount === 2 && mainBranchProtection.strict === true;
const hasDevelopBranchProtection =
  developBranchProtection?.requiredApprovingReviewCount === 2 && developBranchProtection.strict === true;
const requiredStatusChecks = [
  "governance-gates",
  "commitlint",
  "platform (lint)",
  "platform (typecheck)",
  "ci",
  "security coverage report",
];
const missingStatusChecksByBranch = {
  develop: requiredStatusChecks.filter(
    (checkName) => !developBranchProtection?.contexts.includes(checkName)
  ),
  main: requiredStatusChecks.filter(
    (checkName) => !mainBranchProtection?.contexts.includes(checkName)
  )
};
const missingStatusChecks = [
  ...missingStatusChecksByBranch.main.map((checkName) => `main:${checkName}`),
  ...missingStatusChecksByBranch.develop.map((checkName) => `develop:${checkName}`)
];
addCheck(
  "branch-protection-baseline",
  hasMainBranchProtection && hasDevelopBranchProtection && missingStatusChecks.length === 0
    ? "pass"
    : "fail",
  {
    hasDevelopBranchProtection,
    hasMainBranchProtection,
    missingStatusChecksByBranch,
    missingStatusChecks,
  },
);

const setupNodeLines = [...ciWorkflow.matchAll(/uses:\s*actions\/setup-node@([^\s]+)/g)].map((m) => m[1]);
addCheck(
  "setup-node-version-pinned",
  setupNodeLines.length > 0 && setupNodeLines.every((version) => version.startsWith("v")) ? "pass" : "warn",
  { setupNodeLines },
);

const setupPythonLines = [
  ...ciWorkflow.matchAll(/uses:\s*actions\/setup-python@([^\s]+)/g),
  ...securityWorkflow.matchAll(/uses:\s*actions\/setup-python@([^\s]+)/g),
].map((m) => m[1]);
addCheck(
  "setup-python-version-pinned",
  setupPythonLines.length > 0 && setupPythonLines.every((version) => version.startsWith("v")) ? "pass" : "warn",
  { setupPythonLines },
);

addCheck(
  "node-version-aligned-with-nvmrc",
  ciWorkflow.includes("node-version-file: .nvmrc") ? "pass" : "warn",
  { nvmrc },
);
addCheck(
  "python-version-aligned-with-python-version",
  ciWorkflow.includes("python-version-file: .python-version") ||
    securityWorkflow.includes("python-version-file: .python-version")
    ? "pass"
    : "warn",
  { pythonVersion },
);

const packageManager = packageJson.packageManager ?? "";
addCheck(
  "pnpm-version-pinned-in-packageManager",
  /^pnpm@\d+\.\d+\.\d+$/.test(packageManager) ? "pass" : "warn",
  { packageManager },
);

const staleF11Phrases = [
  "lint:core remains red",
  "workspace:audit",
  "privacy:verify",
  "ci:security-guardrails",
  "8 errors and 145 warnings",
  "still red",
];

const staleMentions = staleF11Phrases.filter(
  (phrase) => f11ClosureMinutes.includes(phrase) || f11ResidualRisk.includes(phrase),
);

addCheck(
  "f11-docs-consistent-with-latest-closure",
  staleMentions.length === 0 ? "pass" : "fail",
  { staleMentions },
);

const prTemplate = readText(".github/PULL_REQUEST_TEMPLATE.md");
const hasMergeMarkers = prTemplate.includes("<<<<<<<") || prTemplate.includes(">>>>>>>");
addCheck("pr-template-merge-markers", hasMergeMarkers ? "fail" : "pass");

const sourceFiles = ["apps", "packages"]
  .flatMap((directory) => walkFiles(directory))
  .filter((filePath) => !/\.(md|mdx|json)$/i.test(filePath));

const forbiddenImportHits = [];
for (const absolutePath of sourceFiles) {
  const content = readFileSync(absolutePath, "utf8");
  if (!content.includes("@birthub/db")) {
    continue;
  }

  const relative = normalize(path.relative(root, absolutePath));
  if (relative === "packages/db/package.json") {
    continue;
  }
  forbiddenImportHits.push(relative);
}

addCheck(
  "legacy-db-imports-quarantined",
  forbiddenImportHits.length === 0 ? "pass" : "fail",
  { forbiddenImportHits },
);

const artifactDir = path.join(root, "artifacts", "materialization");
mkdirSync(artifactDir, { recursive: true });

const markdownLines = [
  "# Materialização Técnica de Itens Apenas Documentados",
  "",
  `Gerado em: ${result.generatedAt}`,
  "",
  "## Status dos controles",
  "",
  "| Controle | Status | Detalhes |",
  "| --- | --- | --- |",
];

for (const [name, payload] of Object.entries(result.checks)) {
  const details = { ...payload };
  delete details.status;
  markdownLines.push(
    `| ${name} | ${payload.status.toUpperCase()} | ${JSON.stringify(details).replaceAll("|", "\\|")} |`,
  );
}

markdownLines.push("", "## Resumo", "");
markdownLines.push(`- Blockers: ${result.blockers.length}`);
markdownLines.push(`- Warnings: ${result.warnings.length}`);

if (result.blockers.length > 0) {
  markdownLines.push("", "### Blockers", "");
  for (const blocker of result.blockers) {
    markdownLines.push(`- ${blocker}`);
  }
}

if (result.warnings.length > 0) {
  markdownLines.push("", "### Warnings", "");
  for (const warning of result.warnings) {
    markdownLines.push(`- ${warning}`);
  }
}

writeFileSync(
  path.join(artifactDir, "doc-only-controls-report.json"),
  `${JSON.stringify(result, null, 2)}\n`,
);
writeFileSync(
  path.join(artifactDir, "doc-only-controls-report.md"),
  `${markdownLines.join("\n")}\n`,
);

if (result.blockers.length > 0) {
  console.error("[materialize-doc-only-controls] blockers encontrados:");
  for (const blocker of result.blockers) {
    console.error(`- ${blocker}`);
  }
  process.exit(1);
}

console.log("[materialize-doc-only-controls] OK");
