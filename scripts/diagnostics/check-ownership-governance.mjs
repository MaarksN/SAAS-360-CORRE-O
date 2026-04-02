import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..", "..");

const report = {
  generatedAt: new Date().toISOString(),
  checks: {},
  failures: [],
};

function addCheck(name, ok, details = {}) {
  report.checks[name] = {
    status: ok ? "pass" : "fail",
    ...details,
  };
  if (!ok) {
    report.failures.push(name);
  }
}

function readText(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function normalizeOwnerPattern(pattern) {
  const trimmed = pattern.trim();
  if (!trimmed) return "";
  if (trimmed === "*") return "*";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function patternToRegex(pattern) {
  if (pattern === "*") return /^.*$/;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

function isCoveredByPattern(target, rawPattern) {
  const pattern = normalizeOwnerPattern(rawPattern);
  if (!pattern) return false;

  if (target.includes("*")) {
    const prefix = normalizeOwnerPattern(target.split("*")[0]);
    if (pattern === "*") return true;
    if (pattern.includes("*")) return patternToRegex(pattern).test(prefix);
    if (pattern.endsWith("/")) return prefix.startsWith(pattern) || pattern.startsWith(prefix);
    return prefix === pattern || prefix.startsWith(`${pattern}/`) || pattern.startsWith(`${prefix}/`);
  }

  const normalizedTarget = normalizeOwnerPattern(target);
  if (pattern === "*") return true;
  if (pattern.includes("*")) return patternToRegex(pattern).test(normalizedTarget);
  if (pattern.endsWith("/")) return normalizedTarget.startsWith(pattern);
  return normalizedTarget === pattern || normalizedTarget.startsWith(`${pattern}/`);
}

function parseCodeownersPatterns(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split(/\s+/)[0])
    .map(normalizeOwnerPattern)
    .filter(Boolean);
}

function parseCriticalComponents(content) {
  const components = [];
  for (const line of content.split(/\r?\n/)) {
    if (!line.startsWith("|")) continue;
    const matches = [...line.matchAll(/`([^`]+)`/g)];
    if (matches.length === 0) continue;
    const candidate = matches[0][1].trim();
    if (candidate) {
      components.push(candidate);
    }
  }
  return [...new Set(components)];
}

const matrixPath = "docs/operations/f0-ownership-matrix.md";
const serviceCriticalityPath = "docs/service-criticality.md";
const codeownersPath = ".github/CODEOWNERS";
const rootCodeownersPath = "CODEOWNERS";

const hasMatrix = existsSync(path.join(root, matrixPath));
const hasServiceCriticality = existsSync(path.join(root, serviceCriticalityPath));
const hasCodeowners = existsSync(path.join(root, codeownersPath));
const hasRootCodeowners = existsSync(path.join(root, rootCodeownersPath));

addCheck("matrix-exists", hasMatrix, { path: matrixPath });
addCheck("service-criticality-exists", hasServiceCriticality, { path: serviceCriticalityPath });
addCheck("codeowners-canonical-exists", hasCodeowners, { path: codeownersPath });
addCheck("root-codeowners-removed", !hasRootCodeowners, { path: rootCodeownersPath });

let matrix = "";
let serviceCriticality = "";
let codeowners = "";

if (hasMatrix) {
  matrix = readText(matrixPath);
}
if (hasServiceCriticality) {
  serviceCriticality = readText(serviceCriticalityPath);
}
if (hasCodeowners) {
  codeowners = readText(codeownersPath);
}

if (matrix) {
  const requiredDomains = ["Web", "API", "Worker", "Database", "Agents", "Security", "DevOps"];
  const missingDomains = requiredDomains.filter((domain) => !new RegExp(`\\|\\s*${domain}\\s*\\|`, "m").test(matrix));
  addCheck("required-domains-present", missingDomains.length === 0, { missingDomains });

  addCheck(
    "wiki-permalink-present",
    /https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/wiki\/[^\s)]+/.test(matrix),
    {},
  );
  addCheck("versioning-section-present", /##\s+Versionamento/i.test(matrix), {});
  addCheck("quarterly-review-date-present", /2026-07-01 10:00 America\/Sao_Paulo/.test(matrix), {});
  addCheck("jira-link-present", /https:\/\/jira\.[^\s/]+\/browse\/[A-Z0-9-]+/.test(matrix), {});
  addCheck("calendar-reference-present", /ownership-quarterly-review\.ics/.test(matrix), {});
}

if (serviceCriticality && codeowners) {
  const criticalComponents = parseCriticalComponents(serviceCriticality);
  const ownerPatterns = parseCodeownersPatterns(codeowners);
  const missingCoverage = criticalComponents.filter(
    (component) => !ownerPatterns.some((pattern) => isCoveredByPattern(component, pattern)),
  );

  addCheck("critical-components-covered-by-codeowners", missingCoverage.length === 0, {
    criticalComponents,
    missingCoverage,
  });
}

const artifactDir = path.join(root, "artifacts", "ownership-governance");
mkdirSync(artifactDir, { recursive: true });

const markdown = [
  "# Ownership Governance Report",
  "",
  `Generated at: ${report.generatedAt}`,
  "",
  "| Check | Status | Details |",
  "| --- | --- | --- |",
];

for (const [name, payload] of Object.entries(report.checks)) {
  const details = { ...payload };
  delete details.status;
  markdown.push(
    `| ${name} | ${payload.status.toUpperCase()} | ${JSON.stringify(details).replaceAll("|", "\\|")} |`,
  );
}

writeFileSync(path.join(artifactDir, "ownership-governance-report.json"), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(path.join(artifactDir, "ownership-governance-report.md"), `${markdown.join("\n")}\n`);

if (report.failures.length > 0) {
  console.error("[check-ownership-governance] failed checks:");
  for (const failure of report.failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("[check-ownership-governance] OK");
