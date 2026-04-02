import path from "node:path";
import { promises as fs } from "node:fs";

import {
  analysisOutputPath,
  auditRoot,
  classifyKind,
  countMatches,
  detectLanguage,
  ensureDirectory,
  fromRepo,
  getTopLevel,
  listMatches,
  listTrackedExistingFiles,
  readTextFile,
  relativeToAbsolute,
  repoRoot,
  runCommand,
  sha256File,
  shouldIncludeEvidence,
  summarizeList,
  toPosix,
  writeJson,
  writeText
} from "./shared.mjs";

const fixCatalog = [
  {
    issue_id: "logger-transport-stability",
    severity: "high",
    role: "Core structured logger transport shared by API, worker and packages.",
    explanation:
      "Reuses a single pino-pretty transport so runtime logger creation does not add duplicate process exit listeners and destabilize test lanes.",
    source_paths: ["packages/logger/src/index.ts"],
    verification_commands: [
      "corepack pnpm --filter @birthub/logger test",
      "corepack pnpm --filter @birthub/api test:security"
    ]
  },
  {
    issue_id: "package-manager-pinning",
    severity: "high",
    role: "Root script execution compatibility across developer and CI environments.",
    explanation:
      "Pins root script entrypoints to corepack pnpm so workspace validation does not depend on whichever global pnpm version is installed on the machine.",
    source_paths: ["package.json"],
    verification_commands: [
      "corepack pnpm ci:task lint",
      "corepack pnpm ci:task typecheck",
      "corepack pnpm ci:task test"
    ]
  },
  {
    issue_id: "utils-logger-alignment",
    severity: "high",
    role: "Structured logging baseline for shared utility consumers.",
    explanation:
      "Aligns the legacy utils logger with the structured Pino-based logger used across the platform and preserves backwards-compatible call patterns.",
    source_paths: ["packages/utils/src/logger.ts", "packages/utils/package.json", "packages/utils/index.ts", "packages/utils/src/index.ts"],
    verification_commands: ["corepack pnpm --filter @birthub/utils typecheck"]
  },
  {
    issue_id: "queue-manager-hardening",
    severity: "critical",
    role: "Shared queue runtime used by agent workers and queue scripts.",
    explanation:
      "Hardens the shared BullMQ queue manager with stronger types, default retention settings, structured logs and queue metrics.",
    source_paths: ["packages/queue/src/index.ts", "packages/queue/src/definitions.ts", "packages/queue/package.json"],
    verification_commands: ["corepack pnpm --filter @birthub/queue typecheck"]
  },
  {
    issue_id: "api-security-suite-listener-stability",
    severity: "medium",
    role: "API security regression test stability.",
    explanation:
      "Keeps the suite aligned with higher listener ceilings while the shared logger transport remains stable across repeated app bootstraps.",
    source_paths: ["apps/api/tests/security.test.ts", "packages/logger/src/index.ts"],
    verification_commands: ["corepack pnpm --filter @birthub/api test:security"]
  },
  {
    issue_id: "api-error-handler-snapshot",
    severity: "medium",
    role: "Central API error handler.",
    explanation: "Materializes the production API error handler into the autofix snapshot set.",
    source_paths: ["apps/api/src/middleware/error-handler.ts"],
    verification_commands: ["corepack pnpm --filter @birthub/api typecheck"]
  },
  {
    issue_id: "api-rate-limit-snapshot",
    severity: "medium",
    role: "Global/login/webhook rate limiting middleware.",
    explanation: "Materializes the production API rate limiting middleware into the autofix snapshot set.",
    source_paths: ["apps/api/src/middleware/rate-limit.ts"],
    verification_commands: ["corepack pnpm --filter @birthub/api typecheck"]
  },
  {
    issue_id: "api-authentication-snapshot",
    severity: "medium",
    role: "Session/API key authentication middleware.",
    explanation: "Materializes the production authentication middleware into the autofix snapshot set.",
    source_paths: ["apps/api/src/middleware/authentication.ts"],
    verification_commands: ["corepack pnpm --filter @birthub/api typecheck"]
  },
  {
    issue_id: "worker-runtime-snapshot",
    severity: "medium",
    role: "Primary worker queue runtime.",
    explanation: "Materializes the production worker runtime entrypoint into the autofix snapshot set.",
    source_paths: ["apps/worker/src/worker.ts"],
    verification_commands: ["corepack pnpm --filter @birthub/worker typecheck"]
  },
  {
    issue_id: "metrics-service-snapshot",
    severity: "medium",
    role: "Agent metrics service used by the API.",
    explanation: "Materializes the production metrics service into the autofix snapshot set.",
    source_paths: ["apps/api/src/modules/agents/metrics.service.ts"],
    verification_commands: ["corepack pnpm --filter @birthub/api typecheck"]
  }
];

function relatedTestsFor(relativePath, allFiles) {
  if (classifyKind(relativePath) === "test") {
    return [relativePath];
  }

  const stem = path.posix.basename(relativePath).replace(/\.(d\.)?[a-z0-9]+$/i, "");
  return allFiles
    .filter((candidate) => classifyKind(candidate) === "test")
    .filter((candidate) => candidate.includes(stem))
    .slice(0, 8);
}

function extractFacts(relativePath, content, allFiles) {
  const imports = content
    ? listMatches(
        content,
        /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)/g
      )
    : [];
  const exports = content
    ? listMatches(content, /export\s+(?:async\s+)?(?:class|const|enum|function|interface|type)\s+([A-Za-z0-9_]+)/g)
    : [];
  const envVars = content ? listMatches(content, /process\.env\.([A-Z0-9_]+)/g) : [];
  const relatedTests = relatedTestsFor(relativePath, allFiles);
  const riskFlags = [];
  const runtimeLike = classifyKind(relativePath) === "runtime";

  if (!content) {
    riskFlags.push({ code: "non_text", detail: "Binary or non-text file; static content scan skipped.", weight: 0 });
  }

  if (content) {
    const anyCount = countMatches(content, /\bany\b/g);
    if (anyCount > 0) {
      riskFlags.push({ code: "any_usage", detail: `Contains ${anyCount} occurrence(s) of 'any'.`, weight: Math.min(30, anyCount * 3) });
    }

    if (/\beval\s*\(|new Function\s*\(/.test(content)) {
      riskFlags.push({ code: "dynamic_code_execution", detail: "Contains dynamic code execution primitives.", weight: 60 });
    }

    const consoleCount = countMatches(content, /console\.(?:debug|error|info|log|warn)\s*\(/g);
    if (runtimeLike && consoleCount > 0) {
      riskFlags.push({ code: "console_logging", detail: `Uses console-based logging ${consoleCount} time(s) in runtime code.`, weight: Math.min(25, consoleCount * 5) });
    }

    if (
      runtimeLike &&
      countMatches(content, /axios\.(?:get|post|put|delete|request)|fetch\s*\(|https?:\/\/|new URL\(/g) > 0 &&
      !/timeout|AbortController|AbortSignal/.test(content)
    ) {
      riskFlags.push({ code: "network_without_timeout", detail: "External network operations do not show an explicit timeout or abort path.", weight: 20 });
    }

    if (
      runtimeLike &&
      /process\.env\./.test(content) &&
      !/@birthub\/config/.test(content) &&
      !relativePath.includes("config")
    ) {
      riskFlags.push({ code: "direct_env_access", detail: "Reads environment variables directly outside the shared config surface.", weight: 10 });
    }

    if (
      runtimeLike &&
      /(createWorker|new Worker|new Queue|QueueManager)/.test(content) &&
      !/attempts|backoff|removeOnFail|removeOnComplete|rate limit|rateLimit/i.test(content)
    ) {
      riskFlags.push({ code: "queue_guardrails_missing", detail: "Queue usage appears without obvious retry/retention/backpressure controls in the same file.", weight: 15 });
    }

    if (
      runtimeLike &&
      !/createLogger|logger\.|incrementCounter|observeHistogram|setGauge/.test(content) &&
      /(express|Queue|Worker|axios|fetch|prisma|listen\(|router\.)/.test(content)
    ) {
      riskFlags.push({ code: "limited_observability", detail: "Runtime side effects appear without structured logging or metrics in the same file.", weight: 12 });
    }

    if (runtimeLike && relatedTests.length === 0) {
      riskFlags.push({ code: "no_related_test", detail: "No directly related automated test file was found by filename heuristic.", weight: 10 });
    }
  }

  let riskScore = classifyKind(relativePath) === "runtime" ? 20 : 0;
  if (classifyKind(relativePath) === "test") {
    riskScore += 5;
  }
  if (classifyKind(relativePath) === "infra" || classifyKind(relativePath) === "config") {
    riskScore += 10;
  }

  for (const riskFlag of riskFlags) {
    riskScore += riskFlag.weight;
  }

  if (runtimeLike && relatedTests.length > 0) {
    riskScore = Math.max(0, riskScore - 5);
  }

  riskScore = Math.max(0, Math.min(100, riskScore));

  let status = "OK";
  if (classifyKind(relativePath) === "historical" || classifyKind(relativePath) === "artifact") {
    status = "ORFAO";
  } else if (riskScore >= 70) {
    status = "CRITICO";
  } else if (riskScore >= 35) {
    status = "MELHORAR";
  }

  return { envVars, exports, imports, relatedTests, riskFlags, riskScore, status };
}

function inferPurpose(relativePath, kind, facts) {
  const exportSummary =
    facts.exports.length > 0
      ? `Declares exports such as ${summarizeList(facts.exports, 5)}.`
      : "No explicit named exports detected.";

  if (kind === "runtime") return `Executable source under ${getTopLevel(relativePath)}. ${exportSummary}`;
  if (kind === "test") return "Automated verification asset for runtime or package behavior.";
  if (kind === "infra") return `Infrastructure or delivery definition. ${exportSummary}`;
  if (kind === "config") return `Configuration or manifest file controlling runtime/build behavior. ${exportSummary}`;
  if (kind === "historical") return "Historical/reporting artifact preserved only for backup or repository hygiene reasons.";
  return "Documentation or non-runtime supporting material.";
}

function inferArchitecturalRole(relativePath, kind) {
  if (relativePath.startsWith("apps/api/")) return "API layer component.";
  if (relativePath.startsWith("apps/web/")) return "Web application component.";
  if (relativePath.startsWith("apps/worker/")) return "Background worker and queue execution component.";
  if (relativePath.startsWith("packages/")) return "Shared package surface used across the monorepo.";
  if (relativePath.startsWith("agents/")) return "Agent-specific runtime or support module.";
  if (kind === "infra") return "Infrastructure-as-code or delivery pipeline definition.";
  if (kind === "test") return "Verification and regression coverage surface.";
  if (kind === "doc" || kind === "historical") return "Non-executable supporting material.";
  return "Repository root or cross-cutting support file.";
}

function inferOperationalRelevance(relativePath, kind, evidenceIncluded) {
  if (!evidenceIncluded) {
    return `Excluded from the SaaS score as ${kind}; still inventoried for completeness.`;
  }
  if (relativePath.startsWith("apps/") || relativePath.startsWith("packages/") || relativePath.startsWith("agents/")) {
    return "Included in the SaaS score because it directly shapes runtime behavior or quality gates.";
  }
  if (kind === "infra" || kind === "config") {
    return "Included in the SaaS score because it affects deployment, security or environment control.";
  }
  return "Included in the SaaS score.";
}

function renderAnalysis(relativePath, entry, facts) {
  const evidenceLines = [
    `Kind: ${entry.kind}`,
    `Language: ${entry.language}`,
    `Top level: ${entry.top_level}`,
    `Size: ${entry.size} bytes`,
    `SHA-256: ${entry.sha256}`,
    `Direct imports/refs: ${summarizeList(facts.imports)}`,
    `Env vars: ${summarizeList(facts.envVars)}`,
    `Related tests: ${summarizeList(facts.relatedTests)}`
  ];
  const problems =
    facts.riskFlags.length === 0
      ? ["No heuristic issues were triggered by the static scan."]
      : facts.riskFlags.map((riskFlag) => `${riskFlag.code}: ${riskFlag.detail}`);

  return [
    `# ${relativePath}`,
    "",
    "## Purpose",
    `- ${inferPurpose(relativePath, entry.kind, facts)}`,
    "",
    "## Architectural Role",
    `- ${inferArchitecturalRole(relativePath, entry.kind)}`,
    "",
    "## Dependencies",
    `- Imports/refs: ${summarizeList(facts.imports)}`,
    `- Env vars: ${summarizeList(facts.envVars)}`,
    `- Related tests: ${summarizeList(facts.relatedTests)}`,
    "",
    "## Operational Relevance",
    `- ${inferOperationalRelevance(relativePath, entry.kind, entry.evidence_included)}`,
    "",
    "## Problems",
    ...problems.map((problem) => `- ${problem}`),
    "",
    "## Risk Score",
    `- ${facts.riskScore}/100`,
    "",
    "## Status",
    `- ${facts.status}`,
    "",
    "## Evidence",
    ...evidenceLines.map((line) => `- ${line}`),
    ""
  ].join("\n");
}

function summarizeChecks(checks) {
  return checks.map((check) => ({
    name: check.name,
    command: check.command,
    exit_code: check.exitCode,
    stdout: check.stdout,
    stderr: check.stderr
  }));
}

function buildChecks() {
  return [
    { name: "logger-tests", ...runCommand("corepack", ["pnpm", "--filter", "@birthub/logger", "test"]) },
    { name: "api-security-tests", ...runCommand("corepack", ["pnpm", "--filter", "@birthub/api", "test:security"]) },
    { name: "database-tests", ...runCommand("corepack", ["pnpm", "--filter", "@birthub/database", "test"]) }
  ];
}

function parseCheckSummary(check) {
  const text = `${check.stdout}\n${check.stderr}`;
  return {
    hasMaxListenersWarning: text.includes("MaxListenersExceededWarning"),
    passed: check.exitCode === 0 && (/pass\s+\d+/i.test(text) || /✔/u.test(text)),
    skippedCount: Number((text.match(/skip(?:ped)?\s+(\d+)/i) ?? [])[1] ?? 0)
  };
}

function buildScoreCard(context) {
  const has = (relativePath) => context.paths.has(relativePath);
  const loggerCheck = parseCheckSummary(context.checks[0]);
  const apiSecurityCheck = parseCheckSummary(context.checks[1]);
  const databaseCheck = parseCheckSummary(context.checks[2]);
  const runtimeAnyFiles = context.inventory.filter(
    (entry) => entry.kind === "runtime" && entry.risk_flags.some((flag) => flag.code === "any_usage")
  ).length;
  const consoleRuntimeFiles = context.inventory.filter(
    (entry) => entry.kind === "runtime" && entry.risk_flags.some((flag) => flag.code === "console_logging")
  ).length;
  const timeoutLightFiles = context.inventory.filter(
    (entry) => entry.kind === "runtime" && entry.risk_flags.some((flag) => flag.code === "network_without_timeout")
  ).length;
  const testFiles = context.inventory.filter((entry) => entry.kind === "test").length;

  const categories = [
    {
      max: 20,
      name: "Arquitetura",
      score:
        (has("apps/api/src/app.ts") ? 5 : 0) +
        (has("apps/web/package.json") ? 4 : 0) +
        (has("apps/worker/src/worker.ts") ? 4 : 0) +
        (has("packages/queue/src/index.ts") ? 3 : 0) +
        (Array.from(context.paths).some((value) => value.startsWith("packages/database/prisma/migrations/")) ? 4 : 0),
      diagnosis:
        "Monorepo separation between web, api, worker and shared packages is present, with explicit queue/database/auth packages.",
      evidence: [
        has("apps/api/src/app.ts") ? "apps/api runtime detected" : "apps/api runtime missing",
        has("apps/web/package.json") ? "apps/web runtime detected" : "apps/web runtime missing",
        has("apps/worker/src/worker.ts") ? "apps/worker runtime detected" : "apps/worker runtime missing",
        has("packages/queue/src/index.ts") ? "packages/queue shared package detected" : "packages/queue shared package missing"
      ],
      risks: [
        runtimeAnyFiles > 0 ? `${runtimeAnyFiles} runtime file(s) still expose 'any'.` : "No widespread 'any' usage triggered in runtime exports.",
        `${context.inventory.filter((entry) => entry.kind === "runtime").length} runtime files inventoried.`
      ],
      evolve: [
        "Continue reducing legacy surfaces that still expose untyped contracts.",
        "Keep central runtime boundaries on apps/* and shared capabilities on packages/*."
      ]
    },
    {
      max: 15,
      name: "Escalabilidade",
      score:
        (has("packages/queue/src/index.ts") ? 5 : 0) +
        (has("apps/worker/src/worker.ts") ? 4 : 0) +
        (has("apps/api/src/lib/queue.ts") ? 3 : 0) +
        (has("packages/database/src/client.ts") ? 3 : 0),
      diagnosis:
        "Async processing and database connection controls exist, but some agent/runtime edges still rely on defaults and timeout-light HTTP paths.",
      evidence: [
        has("packages/queue/src/index.ts") ? "BullMQ queue manager present" : "BullMQ queue manager missing",
        has("apps/api/src/lib/queue.ts") ? "API queue backpressure module present" : "API queue backpressure module missing",
        has("packages/database/src/client.ts") ? "Database timeout/metrics wrapper present" : "Database timeout wrapper missing"
      ],
      risks: [
        timeoutLightFiles > 0
          ? `${timeoutLightFiles} runtime file(s) show outbound network activity without explicit timeout hints.`
          : "No timeout-light network file triggered the heuristic.",
        consoleRuntimeFiles > 0 ? `${consoleRuntimeFiles} runtime file(s) still use console logging.` : "Structured logging dominates runtime surfaces."
      ],
      evolve: [
        "Add explicit HTTP timeout/retry policy to remaining agent worker integrations.",
        "Keep queue depth metrics and backpressure thresholds enforced in all entrypoints."
      ]
    },
    {
      max: 15,
      name: "Seguranca",
      score:
        (has("apps/api/src/middleware/authentication.ts") ? 4 : 0) +
        (has("apps/api/src/middleware/rate-limit.ts") ? 4 : 0) +
        (has("apps/api/src/middleware/csrf.ts") ? 3 : 0) +
        (has("packages/database/test/rls.test.ts") ? 2 : 0) +
        (has(".github/workflows/security-scan.yml") ? 2 : 0),
      diagnosis:
        "Core security controls are implemented in code and CI, with authentication, CSRF, rate limiting, RLS migrations and security workflows present.",
      evidence: [
        has("apps/api/src/middleware/authentication.ts") ? "Authentication middleware present" : "Authentication middleware missing",
        has("apps/api/src/middleware/rate-limit.ts") ? "Rate limit middleware present" : "Rate limit middleware missing",
        has("apps/api/src/middleware/csrf.ts") ? "CSRF middleware present" : "CSRF middleware missing",
        has("packages/database/test/rls.test.ts") ? "RLS test present" : "RLS test missing"
      ],
      risks: [
        databaseCheck.skippedCount > 0
          ? `Database test lane skipped ${databaseCheck.skippedCount} test(s), including tenant isolation proof when no DB is provisioned.`
          : "Database isolation tests executed without skips.",
        apiSecurityCheck.hasMaxListenersWarning
          ? "Security suite still emitted MaxListenersExceededWarning."
          : "Security suite completed without MaxListenersExceededWarning."
      ],
      evolve: [
        "Provision database-backed security verification in local/CI parity environments so RLS proof never relies on skipped tests.",
        "Retire remaining runtime files with direct env access or console logging."
      ]
    },
    {
      max: 10,
      name: "Observabilidade",
      score:
        (has("packages/logger/src/index.ts") ? 3 : 0) +
        (has("apps/api/src/observability/otel.ts") && has("apps/worker/src/observability/otel.ts") ? 4 : 0) +
        (has("apps/api/src/observability/sentry.ts") || has("apps/web/sentry.server.config.ts") ? 2 : 0) +
        (has("infra/monitoring/prometheus.yml") ? 1 : 0),
      diagnosis:
        "Structured logging, Prometheus-style metrics, OpenTelemetry and Sentry are wired into the core platform.",
      evidence: [
        has("packages/logger/src/index.ts") ? "packages/logger present" : "packages/logger missing",
        has("apps/api/src/observability/otel.ts") ? "API OTEL bootstrap present" : "API OTEL bootstrap missing",
        has("apps/worker/src/observability/otel.ts") ? "Worker OTEL bootstrap present" : "Worker OTEL bootstrap missing"
      ],
      risks: [
        consoleRuntimeFiles > 0 ? `${consoleRuntimeFiles} runtime file(s) still bypass structured logging.` : "No console-heavy runtime files detected.",
        "OTEL modules are present in API and worker."
      ],
      evolve: [
        "Continue migrating legacy console-based agent workers to structured logging.",
        "Track queue and agent-specific SLOs in the same telemetry plane."
      ]
    },
    {
      max: 10,
      name: "Performance",
      score:
        (has("packages/database/src/client.ts") ? 4 : 0) +
        (has("apps/api/src/metrics.ts") ? 2 : 0) +
        (has("apps/worker/src/metrics.ts") ? 2 : 0) +
        (has("scripts/performance/api-latency-baseline.mjs") ? 2 : 0),
      diagnosis:
        "Performance guardrails exist around database latency, queue backpressure and web vital metrics, but not every runtime path is uniformly hardened.",
      evidence: [
        has("packages/database/src/client.ts") ? "Database latency instrumentation present" : "Database latency instrumentation missing",
        has("apps/api/src/metrics.ts") ? "API metrics endpoint present" : "API metrics endpoint missing",
        has("scripts/performance/api-latency-baseline.mjs") ? "Performance scripts present" : "Performance scripts missing"
      ],
      risks: [
        timeoutLightFiles > 0
          ? `${timeoutLightFiles} runtime file(s) have outbound network activity without explicit timeout hints.`
          : "No timeout-light network heuristic triggered.",
        "Performance baselines currently live as scripts/artifacts, not all as blocking checks."
      ],
      evolve: [
        "Add explicit timeouts and retry policies to remaining outbound HTTP worker paths.",
        "Expand performance regression checks from scripts into blocking CI gates where feasible."
      ]
    },
    {
      max: 10,
      name: "Qualidade de codigo",
      score:
        (has("tsconfig.base.json") ? 3 : 0) +
        (has(".github/workflows/ci.yml") ? 3 : 0) +
        Math.max(0, 4 - Math.min(4, runtimeAnyFiles)),
      diagnosis:
        "Strict TypeScript and workspace quality lanes exist, but public/shared surfaces still contain untyped escape hatches.",
      evidence: [
        has("tsconfig.base.json") ? "Workspace TypeScript base config present" : "TypeScript base config missing",
        has(".github/workflows/ci.yml") ? "Blocking lint/typecheck lanes present" : "Lint/typecheck lanes missing",
        runtimeAnyFiles > 0 ? `${runtimeAnyFiles} runtime file(s) contain 'any'.` : "No runtime 'any' heuristic triggered."
      ],
      risks: [
        runtimeAnyFiles > 0 ? `${runtimeAnyFiles} runtime file(s) contain 'any'.` : "No runtime 'any' heuristic triggered.",
        consoleRuntimeFiles > 0 ? `${consoleRuntimeFiles} runtime file(s) still use console logging.` : "Console logging is not widespread."
      ],
      evolve: [
        "Eliminate remaining 'any' from shared contracts and legacy workers first.",
        "Keep queue/logger shared packages on the same observability contract."
      ]
    },
    {
      max: 10,
      name: "Testes",
      score:
        Math.min(6, Math.floor(testFiles / 40)) +
        (loggerCheck.passed ? 2 : 0) +
        (apiSecurityCheck.passed ? 2 : 0) -
        Math.min(2, databaseCheck.skippedCount),
      diagnosis:
        "Unit, integration and E2E surfaces are present across core apps and packages. Core logger/security checks pass locally; DB proof still depends on environment.",
      evidence: [
        `${testFiles} tracked test file(s) included in the sanitized repo state`,
        loggerCheck.passed ? "Logger tests passed" : "Logger tests did not pass",
        apiSecurityCheck.passed ? "API security tests passed" : "API security tests did not pass",
        databaseCheck.skippedCount > 0
          ? `Database test lane skipped ${databaseCheck.skippedCount} test(s)`
          : "Database tests completed without skips"
      ],
      risks: [
        databaseCheck.skippedCount > 0
          ? "Database isolation proof is still environment-dependent."
          : "Database isolation proof ran in the current environment.",
        apiSecurityCheck.hasMaxListenersWarning ? "Security suite emitted listener warnings." : "Security suite ran without listener warnings."
      ],
      evolve: [
        "Provision a deterministic PostgreSQL target for local/CI parity so RLS proof is always executed.",
        "Add direct tests around queue-manager shared package behavior."
      ]
    },
    {
      max: 10,
      name: "DevOps / CI-CD",
      score:
        (has(".github/workflows/ci.yml") ? 3 : 0) +
        (has(".github/workflows/cd.yml") ? 3 : 0) +
        (has("infra/terraform/main.tf") ? 2 : 0) +
        (has("docker-compose.prod.yml") ? 2 : 0),
      diagnosis:
        "The repository has substantial CI/CD, security scan and deployment workflow coverage, plus Terraform and container definitions.",
      evidence: [
        has(".github/workflows/ci.yml") ? "CI workflow present" : "CI workflow missing",
        has(".github/workflows/cd.yml") ? "CD workflow present" : "CD workflow missing",
        has("infra/terraform/main.tf") ? "Terraform present" : "Terraform missing",
        has("docker-compose.prod.yml") ? "Production compose definition present" : "Production compose missing"
      ],
      risks: [
        has(".github/workflows/cd.yml") ? "Release workflow exists and validates staged configuration." : "CD workflow missing.",
        "Some operational proof still depends on environment-specific services or secrets."
      ],
      evolve: [
        "Move more performance and database proof steps into the blocking release path.",
        "Keep release evidence generation separate from architecture/audit history."
      ]
    }
  ];

  return {
    categories: categories.map((category) => ({
      ...category,
      score: Math.max(0, Math.min(category.max, category.score))
    })),
    total: categories.reduce((sum, category) => sum + Math.max(0, Math.min(category.max, category.score)), 0)
  };
}

function maturityLabel(total) {
  if (total <= 40) return "MVP fragil";
  if (total <= 70) return "sistema em crescimento";
  if (total <= 85) return "quase production-ready";
  return "enterprise-grade";
}

function buildGapList(context) {
  const databaseCheck = parseCheckSummary(context.checks[2]);
  const runtimeAnyFiles = context.inventory.filter(
    (entry) => entry.kind === "runtime" && entry.risk_flags.some((flag) => flag.code === "any_usage")
  );
  const consoleRuntimeFiles = context.inventory.filter(
    (entry) => entry.kind === "runtime" && entry.risk_flags.some((flag) => flag.code === "console_logging")
  );
  const timeoutLightFiles = context.inventory.filter(
    (entry) => entry.kind === "runtime" && entry.risk_flags.some((flag) => flag.code === "network_without_timeout")
  );
  const gaps = [];

  if (databaseCheck.skippedCount > 0) {
    gaps.push({
      name: "database-proof-environment",
      type: "partial",
      impact: "High: cross-tenant controls cannot be fully re-proven without a provisioned PostgreSQL target.",
      priority: "P0",
      blocking_effect: "Tenant-isolation proof is not guaranteed in every local audit run.",
      recommended_fix: "Provision PostgreSQL for audit runs and fail the audit lane when packages/database tests report skips."
    });
  }
  if (runtimeAnyFiles.length > 0) {
    gaps.push({
      name: "runtime-any-surfaces",
      type: "unsafe",
      impact: `Medium: ${runtimeAnyFiles.length} runtime file(s) still expose 'any'.`,
      priority: "P1",
      blocking_effect: "Static guarantees degrade at shared/runtime boundaries.",
      recommended_fix: "Refactor shared contracts and runtime entrypoints to replace 'any' with explicit schemas or discriminated unions."
    });
  }
  if (consoleRuntimeFiles.length > 0) {
    gaps.push({
      name: "legacy-console-logging",
      type: "partial",
      impact: `Medium: ${consoleRuntimeFiles.length} runtime file(s) still use console logging.`,
      priority: "P1",
      blocking_effect: "Operational logs remain inconsistent across runtime surfaces.",
      recommended_fix: "Migrate remaining runtime files to @birthub/logger so logs, trace context and redaction stay uniform."
    });
  }
  if (timeoutLightFiles.length > 0) {
    gaps.push({
      name: "timeout-light-integrations",
      type: "unsafe",
      impact: `High: ${timeoutLightFiles.length} runtime file(s) show outbound network access without explicit timeout hints.`,
      priority: "P1",
      blocking_effect: "Outbound integrations can hang or fail without bounded latency.",
      recommended_fix: "Add explicit request timeout and retry policy to remaining agent/runtime HTTP clients."
    });
  }

  return gaps;
}

function renderScoreMarkdown(scoreCard, checks) {
  const lines = [
    "# SaaS Maturity Score",
    "",
    `Score final: ${scoreCard.total}/100`,
    `Classificacao: ${maturityLabel(scoreCard.total)}`,
    "",
    "## Check Evidence",
    ...checks.map((check) => `- ${check.name}: exit=${check.exit_code}`),
    ""
  ];

  for (const category of scoreCard.categories) {
    lines.push(`## ${category.name} (${category.score}/${category.max})`);
    lines.push(`Diagnostico: ${category.diagnosis}`);
    lines.push("Evidencia no codigo:");
    lines.push(...category.evidence.map((item) => `- ${item}`));
    lines.push("Riscos:");
    lines.push(...category.risks.map((item) => `- ${item}`));
    lines.push("Como evoluir:");
    lines.push(...category.evolve.map((item) => `- ${item}`));
    lines.push("");
  }

  return lines.join("\n");
}

function renderTargetArchitecture() {
  return [
    "# Target Architecture",
    "",
    "## Current State",
    "- apps/web exists as the web entrypoint.",
    "- apps/api exists as the synchronous API, auth and metrics surface.",
    "- apps/worker exists as the asynchronous execution and notification runtime.",
    "- packages/* contains shared capabilities including auth, config, database, logger, queue and workflows.",
    "- agents/* and packages/agent-* coexist as agent runtime/control-plane surfaces.",
    "- Postgres + Prisma + RLS migrations are present in packages/database.",
    "- Redis + BullMQ are present in apps/api, apps/worker and packages/queue.",
    "- OpenTelemetry, Prometheus-style metrics and Sentry are present in core apps.",
    "",
    "## Ideal State",
    "- apps/web remains the only user-facing application boundary.",
    "- apps/api owns sync request/response paths, auth, billing, connectors and read/write APIs.",
    "- apps/worker owns async execution, webhooks, notifications, scheduled jobs and event fan-out.",
    "- packages/database owns tenant context, RLS-safe repositories, migrations and seed/runtime DB contracts.",
    "- packages/logger, packages/queue and packages/config remain the mandatory observability/runtime primitives for every executable surface.",
    "- agents/* and packages/agent-* are treated as isolated domain workers behind the same queue, auth and telemetry contract.",
    "",
    "## Textual Diagram",
    "```text",
    "[web] -> [api] -> [database/postgres + RLS]",
    "            |",
    "            +-> [redis/bullmq] -> [worker] -> [agents/*]",
    "            |                        |",
    "            |                        +-> [notifications/webhooks]",
    "            +-> [metrics + traces + sentry]",
    "```",
    "",
    "## Current vs Ideal",
    "| Area | Current | Ideal |",
    "| --- | --- | --- |",
    "| Web | Next.js app exists | Keep as sole UI edge |",
    "| API | Express API with auth, metrics and queue integration | Keep sync-only, with stricter policy enforcement at boundaries |",
    "| Worker | BullMQ-based async runtime exists | Keep as async/event execution plane with all side effects centralized |",
    "| Data | Prisma + Postgres + RLS migrations exist | Keep Postgres as system of record and require DB-backed proof in audits |",
    "| Observability | Logger, OTEL, metrics and Sentry exist in core apps | Extend the same contract to legacy agent workers and all outbound integrations |",
    "| Security | Auth, CSRF, rate limit, RLS and security CI exist | Keep and make DB-backed proof mandatory in repeatable audit runs |",
    ""
  ].join("\n");
}

function renderGapsMarkdown(gaps) {
  const lines = ["# Gap Analysis", ""];
  if (gaps.length === 0) {
    lines.push("- No gap met the current reporting threshold.", "");
    return lines.join("\n");
  }
  for (const gap of gaps) {
    lines.push(`## ${gap.name}`);
    lines.push(`- type: ${gap.type}`);
    lines.push(`- impact: ${gap.impact}`);
    lines.push(`- priority: ${gap.priority}`);
    lines.push(`- blocking_effect: ${gap.blocking_effect}`);
    lines.push(`- recommended_fix: ${gap.recommended_fix}`);
    lines.push("");
  }
  return lines.join("\n");
}

function renderChecklistMarkdown(gaps) {
  const lines = ["# Execution Checklist", ""];
  if (gaps.length === 0) {
    lines.push("- Maintain the current guardrails and re-run the audit after substantial code changes.", "");
    return lines.join("\n");
  }
  for (const gap of gaps) {
    lines.push(`- [ ] ${gap.priority} ${gap.name}: ${gap.recommended_fix}`);
  }
  lines.push("");
  return lines.join("\n");
}

function renderHtmlReport(scoreCard, gaps, inventory) {
  const highRisk = inventory.filter((entry) => entry.risk_score >= 70).slice(0, 15);
  const statusClass = (status) =>
    status === "CRITICO" ? "danger" : status === "MELHORAR" ? "warn" : status === "ORFAO" ? "muted" : "ok";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>BirthHub360 Technical Audit</title>
    <style>
      :root { --bg: #f6f1e7; --ink: #12211d; --card: rgba(255,255,255,0.78); --border: rgba(18,33,29,0.12); }
      * { box-sizing: border-box; } body { margin: 0; font-family: "Segoe UI", sans-serif; color: var(--ink);
      background: radial-gradient(circle at top left, rgba(12,111,91,0.18), transparent 30%), radial-gradient(circle at top right, rgba(192,138,31,0.18), transparent 28%), linear-gradient(180deg, #f9f4ea 0%, var(--bg) 100%); }
      main { max-width: 1200px; margin: 0 auto; padding: 40px 24px 64px; } .card { background: var(--card); border: 1px solid var(--border); border-radius: 18px; padding: 20px; margin-bottom: 20px; }
      .hero { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; } .score { font-size: 72px; font-weight: 800; line-height: 1; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; } table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
      .badge { display: inline-block; padding: 4px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; }
      .ok { background: rgba(11,107,75,0.12); color: #0b6b4b; } .warn { background: rgba(192,138,31,0.12); color: #c08a1f; } .danger { background: rgba(155,47,47,0.12); color: #9b2f2f; } .muted { background: rgba(109,115,111,0.12); color: #6d736f; }
      @media (max-width: 800px) { .hero { grid-template-columns: 1fr; } .score { font-size: 56px; } }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <div class="card"><p>BirthHub360</p><h1>Technical Audit Dashboard</h1><div class="score">${scoreCard.total}</div><p>SaaS maturity label: <strong>${maturityLabel(scoreCard.total)}</strong></p></div>
        <div class="card"><h2>Repository Snapshot</h2><p>Total inventoried files: <strong>${inventory.length}</strong></p><p>Critical files: <strong>${inventory.filter((entry) => entry.risk_score >= 70).length}</strong></p><p>Tracked gaps: <strong>${gaps.length}</strong></p></div>
      </section>
      <section class="card"><h2>Pillar Scores</h2><div class="grid">${scoreCard.categories.map((category) => `<div class="card"><h3>${category.name}</h3><p><strong>${category.score}/${category.max}</strong></p><p>${category.diagnosis}</p></div>`).join("")}</div></section>
      <section class="card"><h2>Top Risks</h2><table><thead><tr><th>Path</th><th>Risk</th><th>Status</th></tr></thead><tbody>${highRisk.map((entry) => `<tr><td>${entry.path}</td><td>${entry.risk_score}/100</td><td><span class="badge ${statusClass(entry.status)}">${entry.status}</span></td></tr>`).join("")}</tbody></table></section>
      <section class="card"><h2>Gap Summary</h2><table><thead><tr><th>Name</th><th>Priority</th><th>Impact</th></tr></thead><tbody>${gaps.map((gap) => `<tr><td>${gap.name}</td><td>${gap.priority}</td><td>${gap.impact}</td></tr>`).join("")}</tbody></table></section>
    </main>
  </body>
</html>
`;
}

async function writeAutofixArtifacts() {
  const notesRoot = path.join(auditRoot, "autofix", "notes");
  const snapshotsRoot = path.join(auditRoot, "autofix", "snapshots");
  const manifestItems = [];

  for (const fix of fixCatalog) {
    const snapshotTargets = [];
    for (const sourcePath of fix.source_paths) {
      const absoluteSource = relativeToAbsolute(sourcePath);
      const stats = await fs.stat(absoluteSource).catch(() => null);
      if (!stats) continue;

      const targetPath = path.join(snapshotsRoot, sourcePath);
      await ensureDirectory(path.dirname(targetPath));
      await fs.copyFile(absoluteSource, targetPath);
      snapshotTargets.push(toPosix(path.relative(auditRoot, targetPath)));
    }

    await writeText(path.join(notesRoot, `${fix.issue_id}.md`), `# ${fix.issue_id}\n\nRole: ${fix.role}\n\n${fix.explanation}\n`);
    manifestItems.push({
      issue_id: fix.issue_id,
      severity: fix.severity,
      source_paths: fix.source_paths,
      target_paths: snapshotTargets,
      verification_commands: fix.verification_commands
    });
  }

  await writeJson(path.join(auditRoot, "autofix", "manifest.json"), manifestItems);
}

async function generateAudit() {
  await fs.rm(auditRoot, { force: true, recursive: true });
  await fs.mkdir(auditRoot, { recursive: true });

  const trackedFiles = listTrackedExistingFiles();
  const inventory = [];
  const fileSet = new Set(trackedFiles);

  for (const relativePath of trackedFiles) {
    const kind = classifyKind(relativePath);
    const language = detectLanguage(relativePath);
    const evidenceIncluded = shouldIncludeEvidence(kind);
    const stats = await fs.stat(fromRepo(relativePath));
    const sha256 = await sha256File(fromRepo(relativePath));
    const content = await readTextFile(relativePath);
    const facts = extractFacts(relativePath, content, trackedFiles);
    const outputPath = analysisOutputPath(relativePath);
    const entry = {
      path: relativePath,
      size: stats.size,
      sha256,
      top_level: getTopLevel(relativePath),
      kind,
      language,
      evidence_included: evidenceIncluded,
      analysis_output: outputPath,
      related_tests: facts.relatedTests,
      risk_flags: facts.riskFlags.map((riskFlag) => ({ code: riskFlag.code, detail: riskFlag.detail })),
      risk_score: facts.riskScore,
      status: facts.status
    };

    await writeText(path.join(repoRoot, outputPath), renderAnalysis(relativePath, entry, facts));
    inventory.push(entry);
  }

  const checks = buildChecks();
  const scoreCard = buildScoreCard({ checks, inventory, paths: fileSet });
  const gaps = buildGapList({ checks, inventory });

  await writeJson(path.join(auditRoot, "inventory.json"), inventory);
  await writeJson(path.join(auditRoot, "checks.json"), summarizeChecks(checks));
  await writeText(path.join(auditRoot, "saas_maturity_score.md"), renderScoreMarkdown(scoreCard, summarizeChecks(checks)));
  await writeText(path.join(auditRoot, "target_architecture.md"), renderTargetArchitecture());
  await writeText(path.join(auditRoot, "gaps.md"), renderGapsMarkdown(gaps));
  await writeText(path.join(auditRoot, "execution_checklist.md"), renderChecklistMarkdown(gaps));
  await writeText(path.join(auditRoot, "report.html"), renderHtmlReport(scoreCard, gaps, inventory));
  await writeAutofixArtifacts();

  process.stdout.write(`Generated audit for ${inventory.length} tracked files into ${auditRoot}.\n`);
}

await generateAudit();
