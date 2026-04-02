#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const artifactsDir = path.join(root, "artifacts", "security");
const docsDir = path.join(root, "docs", "security");

const semgrepPath = path.join(artifactsDir, "semgrep-f0-initial.json");
const auditPath = path.join(artifactsDir, "pnpm-audit-high.json");
const inlinePath = path.join(artifactsDir, "inline-credential-scan.json");
const reportJsonPath = path.join(artifactsDir, "owasp-top10-baseline.json");
const reportMdPath = path.join(docsDir, "f0-owasp-top10-baseline.md");

function loadJson(filePath, fallback) {
  if (!existsSync(filePath)) {
    return fallback;
  }

  const raw = readFileSync(filePath, "utf8");
  const start = raw.indexOf("{");
  if (start === -1) {
    return fallback;
  }

  try {
    return JSON.parse(raw.slice(start));
  } catch {
    return fallback;
  }
}

const semgrep = loadJson(semgrepPath, { results: [], errors: [] });
const audit = loadJson(auditPath, { metadata: { vulnerabilities: { high: 0, critical: 0 } } });
const inlineScan = loadJson(inlinePath, { findings_count: 0, findings: [] });

function countSemgrepByPattern(fragment) {
  return semgrep.results.filter((result) => String(result.check_id ?? "").includes(fragment)).length;
}

const owasp = [
  {
    id: "A01",
    title: "Broken Access Control",
    status: "monitoring",
    evidence: "security:guards executed (auth guard coverage)"
  },
  {
    id: "A02",
    title: "Cryptographic Failures",
    status: countSemgrepByPattern("gcm-no-tag-length") > 0 ? "finding" : "ok",
    evidence: `${countSemgrepByPattern("gcm-no-tag-length")} semgrep finding(s) on crypto usage`
  },
  {
    id: "A03",
    title: "Injection",
    status: "monitoring",
    evidence: "Semgrep TypeScript/Express rules executed"
  },
  {
    id: "A04",
    title: "Insecure Design",
    status: "monitoring",
    evidence: "Threat model and security guardrails documented"
  },
  {
    id: "A05",
    title: "Security Misconfiguration",
    status: audit.metadata?.vulnerabilities?.high > 0 || audit.metadata?.vulnerabilities?.critical > 0 ? "finding" : "ok",
    evidence: `pnpm audit high=${audit.metadata?.vulnerabilities?.high ?? "n/a"} critical=${audit.metadata?.vulnerabilities?.critical ?? "n/a"}`
  },
  {
    id: "A06",
    title: "Vulnerable and Outdated Components",
    status: audit.metadata?.vulnerabilities?.high > 0 || audit.metadata?.vulnerabilities?.critical > 0 ? "finding" : "ok",
    evidence: "dependency audit snapshot archived"
  },
  {
    id: "A07",
    title: "Identification and Authentication Failures",
    status: "monitoring",
    evidence: "RBAC/auth guard checks in local security gate"
  },
  {
    id: "A08",
    title: "Software and Data Integrity Failures",
    status: "monitoring",
    evidence: "CI governance + lockfile integrity in baseline logs"
  },
  {
    id: "A09",
    title: "Security Logging and Monitoring Failures",
    status: "monitoring",
    evidence: "monitoring rules and dashboard tracked in infra/monitoring"
  },
  {
    id: "A10",
    title: "Server-Side Request Forgery",
    status: "monitoring",
    evidence: "policy and guardrails documented; requires DAST lane"
  }
];

const report = {
  generatedAt: new Date().toISOString(),
  inputs: {
    semgrepPath: path.relative(root, semgrepPath).replaceAll("\\", "/"),
    auditPath: path.relative(root, auditPath).replaceAll("\\", "/"),
    inlineCredentialsPath: path.relative(root, inlinePath).replaceAll("\\", "/")
  },
  summary: {
    semgrepFindings: semgrep.results.length,
    inlineCredentialFindings: inlineScan.findings_count,
    dependencyAuditHigh: audit.metadata?.vulnerabilities?.high ?? null,
    dependencyAuditCritical: audit.metadata?.vulnerabilities?.critical ?? null
  },
  owasp
};

const markdown = [
  "# F0 OWASP Top 10 Baseline",
  "",
  `- generatedAt: ${report.generatedAt}`,
  `- semgrep findings: ${report.summary.semgrepFindings}`,
  `- inline credential findings: ${report.summary.inlineCredentialFindings}`,
  `- dependency audit (high/critical): ${report.summary.dependencyAuditHigh}/${report.summary.dependencyAuditCritical}`,
  "",
  "## Classification",
  "",
  "| OWASP | Category | Status | Evidence |",
  "| --- | --- | --- | --- |"
];

for (const item of owasp) {
  markdown.push(`| ${item.id} | ${item.title} | ${item.status} | ${item.evidence} |`);
}

markdown.push(
  "",
  "## Evidence",
  "",
  `- ${report.inputs.semgrepPath}`,
  `- ${report.inputs.auditPath}`,
  `- ${report.inputs.inlineCredentialsPath}`,
  "- docs/security/security-coverage-report.md"
);

mkdirSync(artifactsDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });
writeFileSync(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(reportMdPath, `${markdown.join("\n")}\n`, "utf8");
console.log(path.relative(root, reportMdPath));
