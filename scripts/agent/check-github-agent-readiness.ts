import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  PolicyEngine,
  isInstallableManifest,
  loadManifestCatalog,
  runAgentDryRun,
  searchManifestCatalog,
  type AgentManifest
} from "@birthub/agents-core";

import {
  GITHUB_AGENT_COLLECTION_DESCRIPTOR_ID,
  REQUIRED_PROMPT_SECTIONS,
  STANDARD_POLICY_ACTIONS,
  type GithubAgentEvidenceArtifact,
  type GithubAgentReadinessArtifact,
  getGithubAgentArtifactsRoot,
  getGithubAgentCollectionRoot,
  getGithubAgentSourceRoot,
  isGithubAgentSourcePath,
  getWorkspaceRoot,
  isDirectExecution,
  parseMarkdownAgentSource,
  sha256,
  toPosixPath
} from "./github-agent-collection.js";

type ReadinessCheckName = "manifest" | "integration" | "policy" | "adapters" | "evidence";

interface VerifyGithubAgentsReadinessOptions {
  collectionRoot?: string;
  reportRoot?: string;
  workspaceRoot?: string;
}

interface AgentReadinessCheckResult {
  agentId: string;
  checks: Record<ReadinessCheckName, boolean>;
  evidencePath: string;
  manifestPath: string;
  readinessPath: string;
  issues: string[];
}

export interface GithubAgentReadinessGateReport {
  collectionRoot: string;
  descriptor: {
    found: boolean;
    issues: string[];
  };
  failures: Array<{
    agentId: string;
    check: ReadinessCheckName | "descriptor";
    manifestPath: string;
    message: string;
  }>;
  generatedAt: string;
  installableCount: number;
  passedCount: number;
  reportPath: string;
  results: AgentReadinessCheckResult[];
  totalCount: number;
}

const INTEGRATION_EXPECTATIONS: Record<string, string[]> = {
  "apps/api/src/modules/marketplace/marketplace-service.ts": ["loadManifestCatalog", "searchManifestCatalog"],
  "apps/worker/src/agents/runtime.shared.ts": ["loadManifestCatalog", "resolveCatalogRoot"],
  "apps/worker/src/agents/runtime.tools.ts": ["ManifestCapabilityTool", "for (const tool of manifest.tools)"],
  "packages/agents-core/src/policy/engine.ts": ["class PolicyEngine", "evaluate("]
};

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await readFile(filePath, "utf8");
    return true;
  } catch {
    return false;
  }
}

async function directoryExists(directoryPath: string): Promise<boolean> {
  try {
    await readdir(directoryPath);
    return true;
  } catch {
    return false;
  }
}

async function hasGithubAgentSourceFiles(rootDir: string): Promise<boolean> {
  try {
    const entries = await readdir(rootDir, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(rootDir, entry.name);

      if (entry.isDirectory() && (await hasGithubAgentSourceFiles(entryPath))) {
        return true;
      }

      if (entry.isFile() && entry.name.endsWith(".agent.md")) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

function buildPolicyEngine(manifest: AgentManifest): PolicyEngine {
  const rules = manifest.policies.flatMap((policy) =>
    policy.actions.map((action, index) => ({
      action,
      agentId: manifest.agent.id,
      effect: policy.effect,
      id: `${policy.id}.rule.${index + 1}`,
      tenantId: manifest.agent.tenantId
    }))
  );

  return new PolicyEngine(rules);
}

function hasPromptSections(manifest: AgentManifest): string[] {
  return REQUIRED_PROMPT_SECTIONS.filter((section) => !manifest.agent.prompt.includes(section));
}

function resolveWorkspaceRelativePath(workspaceRoot: string, relativeOrAbsolutePath: string): string {
  return path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.resolve(workspaceRoot, relativeOrAbsolutePath);
}

async function validateFileContains(
  workspaceRoot: string,
  relativePath: string,
  expectedTokens: string[]
): Promise<string[]> {
  const resolvedPath = resolveWorkspaceRelativePath(workspaceRoot, relativePath);

  if (!(await fileExists(resolvedPath))) {
    return [`Missing runtime file '${relativePath}'.`];
  }

  const content = await readFile(resolvedPath, "utf8");
  return expectedTokens
    .filter((token) => !content.includes(token))
    .map((token) => `Runtime file '${relativePath}' does not include '${token}'.`);
}

export async function verifyGithubAgentsReadiness(
  options: VerifyGithubAgentsReadinessOptions = {}
): Promise<GithubAgentReadinessGateReport> {
  const workspaceRoot = options.workspaceRoot ?? getWorkspaceRoot();
  const collectionRoot = options.collectionRoot ?? getGithubAgentCollectionRoot(workspaceRoot);
  const reportRoot = options.reportRoot ?? getGithubAgentArtifactsRoot(workspaceRoot);
  const hasGithubAgentSources = await hasGithubAgentSourceFiles(
    getGithubAgentSourceRoot(workspaceRoot)
  );
  const catalog = await loadManifestCatalog(collectionRoot);
  const installableEntries = catalog.filter((entry) => isInstallableManifest(entry.manifest));
  const descriptorEntries = catalog.filter((entry) => !isInstallableManifest(entry.manifest));
  const failures: GithubAgentReadinessGateReport["failures"] = [];
  const descriptorIssues: string[] = [];

  if (descriptorEntries.length !== 1) {
    descriptorIssues.push(`Expected exactly one catalog descriptor, found ${descriptorEntries.length}.`);
  }

  if (descriptorEntries[0]?.manifest.agent.id !== GITHUB_AGENT_COLLECTION_DESCRIPTOR_ID) {
    descriptorIssues.push(
      `Expected descriptor id '${GITHUB_AGENT_COLLECTION_DESCRIPTOR_ID}', found '${descriptorEntries[0]?.manifest.agent.id ?? "missing"}'.`
    );
  }

  if (descriptorIssues.length > 0) {
    failures.push(
      ...descriptorIssues.map((message) => ({
        agentId: GITHUB_AGENT_COLLECTION_DESCRIPTOR_ID,
        check: "descriptor" as const,
        manifestPath:
          descriptorEntries[0]?.manifestPath
            ? toPosixPath(path.relative(workspaceRoot, descriptorEntries[0].manifestPath))
            : toPosixPath(path.relative(workspaceRoot, collectionRoot)),
        message
      }))
    );
  }

  const results: AgentReadinessCheckResult[] = [];

  for (const entry of installableEntries) {
    const manifestPath = entry.manifestPath;
    const agentDir = path.dirname(manifestPath);
    const evidencePath = path.join(agentDir, "evidence.json");
    const readinessPath = path.join(agentDir, "readiness.json");
    const manifest = entry.manifest;
    const issues: string[] = [];
    const checks: Record<ReadinessCheckName, boolean> = {
      adapters: true,
      evidence: true,
      integration: true,
      manifest: true,
      policy: true
    };

    if (!(await fileExists(evidencePath))) {
      checks.evidence = false;
      issues.push("Missing evidence.json artifact.");
    }

    if (!(await fileExists(readinessPath))) {
      checks.adapters = false;
      checks.integration = false;
      checks.manifest = false;
      checks.policy = false;
      issues.push("Missing readiness.json artifact.");
    }

    const missingPromptSections = hasPromptSections(manifest);
    if (missingPromptSections.length > 0) {
      checks.manifest = false;
      issues.push(
        `Manifest prompt missing required sections: ${missingPromptSections.join(", ")}.`
      );
    }

    if (manifest.tools.length === 0 || manifest.skills.length === 0 || manifest.policies.length === 0) {
      checks.manifest = false;
      issues.push("Manifest must declare at least one tool, skill and policy.");
    }

    let readiness: GithubAgentReadinessArtifact | null = null;
    if (await fileExists(readinessPath)) {
      readiness = await readJson<GithubAgentReadinessArtifact>(readinessPath);

      const expectedManifestPath = toPosixPath(path.relative(workspaceRoot, manifestPath));
      if (!readiness.manifest.ready || readiness.manifest.manifestPath !== expectedManifestPath) {
        checks.manifest = false;
        issues.push(
          `Readiness manifest contract does not match '${expectedManifestPath}'.`
        );
      }

      if (!readiness.integration.ready) {
        checks.integration = false;
        issues.push("Readiness integration flag is false.");
      }

      if (!readiness.policy.ready) {
        checks.policy = false;
        issues.push("Readiness policy flag is false.");
      }

      if (!readiness.adapters.ready) {
        checks.adapters = false;
        issues.push("Readiness adapters flag is false.");
      }

      if (!readiness.evidence.ready) {
        checks.evidence = false;
        issues.push("Readiness evidence flag is false.");
      }

      if (!readiness.readiness.overall) {
        issues.push("Overall readiness flag is false.");
      }

      const adapterEntries = readiness.adapters.entries ?? [];
      if (adapterEntries.length !== manifest.tools.length) {
        checks.adapters = false;
        issues.push(
          `Expected ${manifest.tools.length} adapter entries, found ${adapterEntries.length}.`
        );
      }

      const toolMap = new Map(manifest.tools.map((tool) => [tool.id, tool]));
      for (const adapterEntry of adapterEntries) {
        const tool = toolMap.get(adapterEntry.toolId);

        if (!adapterEntry.ready || adapterEntry.action !== "tool:execute") {
          checks.adapters = false;
          issues.push(`Adapter '${adapterEntry.toolId}' is not marked as ready for tool:execute.`);
        }

        if (adapterEntry.adapterType !== "ManifestCapabilityTool") {
          checks.adapters = false;
          issues.push(`Adapter '${adapterEntry.toolId}' must use ManifestCapabilityTool.`);
        }

        if (!tool || tool.name !== adapterEntry.toolName) {
          checks.adapters = false;
          issues.push(`Adapter '${adapterEntry.toolId}' does not match the manifest tool contract.`);
        }
      }

      const apiIssues = await validateFileContains(
        workspaceRoot,
        readiness.integration.apiBindingPath,
        INTEGRATION_EXPECTATIONS["apps/api/src/modules/marketplace/marketplace-service.ts"]
      );
      const workerIssues = await validateFileContains(
        workspaceRoot,
        readiness.integration.workerBindingPath,
        INTEGRATION_EXPECTATIONS["apps/worker/src/agents/runtime.shared.ts"]
      );
      const runtimeToolsIssues = await validateFileContains(
        workspaceRoot,
        readiness.integration.runtimeToolsBindingPath,
        INTEGRATION_EXPECTATIONS["apps/worker/src/agents/runtime.tools.ts"]
      );

      const catalogRootFromReadiness = resolveWorkspaceRelativePath(
        workspaceRoot,
        readiness.integration.catalogRoot
      );
      if (path.resolve(catalogRootFromReadiness) !== path.resolve(collectionRoot)) {
        checks.integration = false;
        issues.push("Readiness catalogRoot does not resolve to the compiled collection root.");
      }

      if (apiIssues.length > 0 || workerIssues.length > 0 || runtimeToolsIssues.length > 0) {
        checks.integration = false;
        issues.push(...apiIssues, ...workerIssues, ...runtimeToolsIssues);
      }

      const idSearch = searchManifestCatalog(catalog, {
        includeCatalogEntries: true,
        query: manifest.agent.id
      });
      const nameSearch = searchManifestCatalog(catalog, {
        includeCatalogEntries: true,
        query: manifest.agent.name
      });
      const discoverableById = idSearch.results.some((result) => result.manifest.agent.id === manifest.agent.id);
      const discoverableByName = nameSearch.results.some(
        (result) => result.manifest.agent.id === manifest.agent.id
      );

      if (!discoverableById || !discoverableByName) {
        checks.integration = false;
        issues.push("Agent is not discoverable via manifest catalog search by id and name.");
      }

      const missingQueries = [manifest.agent.id, manifest.agent.name].filter(
        (value) => !readiness.integration.discoverableQueries.includes(value)
      );
      if (missingQueries.length > 0) {
        checks.integration = false;
        issues.push(
          `Readiness discoverableQueries is missing: ${missingQueries.join(", ")}.`
        );
      }

      const policyIssues = await validateFileContains(
        workspaceRoot,
        readiness.policy.enginePath,
        INTEGRATION_EXPECTATIONS["packages/agents-core/src/policy/engine.ts"]
      );
      if (policyIssues.length > 0) {
        checks.policy = false;
        issues.push(...policyIssues);
      }

      const declaredActions = new Set(manifest.policies.flatMap((policy) => policy.actions));
      const missingActions = Array.from(STANDARD_POLICY_ACTIONS).filter((action) => !declaredActions.has(action));
      if (missingActions.length > 0) {
        checks.policy = false;
        issues.push(`Manifest policies are missing required actions: ${missingActions.join(", ")}.`);
      }

      const policyEngine = buildPolicyEngine(manifest);
      for (const action of readiness.policy.requiredActions) {
        const evaluation = policyEngine.evaluate(manifest.agent.id, action, {
          tenantId: manifest.agent.tenantId
        });

        if (!evaluation.granted) {
          checks.policy = false;
          issues.push(`Policy engine denied required action '${action}'.`);
        }
      }
    }

    if (await fileExists(evidencePath)) {
      const evidence = await readJson<GithubAgentEvidenceArtifact>(evidencePath);
      const expectedEvidencePath = toPosixPath(path.relative(workspaceRoot, evidencePath));
      const resolvedDryRunArtifactPath = readiness
        ? resolveWorkspaceRelativePath(workspaceRoot, readiness.evidence.dryRunArtifactPath)
        : evidencePath;

      if (path.resolve(resolvedDryRunArtifactPath) !== path.resolve(evidencePath)) {
        checks.evidence = false;
        issues.push(
          `Readiness dryRunArtifactPath does not resolve to '${expectedEvidencePath}'.`
        );
      }

      if (evidence.agentId !== manifest.agent.id) {
        checks.evidence = false;
        issues.push("Evidence agentId does not match the manifest id.");
      }

      const sourcePath = resolveWorkspaceRelativePath(workspaceRoot, evidence.sourcePath);
      if (!(await fileExists(sourcePath))) {
        if (hasGithubAgentSources || !isGithubAgentSourcePath(evidence.sourcePath)) {
          checks.evidence = false;
          issues.push(`Evidence source path '${evidence.sourcePath}' does not exist.`);
        }
      } else {
        const sourceRaw = await readFile(sourcePath, "utf8");
        const relativeSourcePath = toPosixPath(path.relative(workspaceRoot, sourcePath));
        const source = parseMarkdownAgentSource(sourceRaw, relativeSourcePath);
        const sourceChecksum = sha256(source.body);

        if (sourceChecksum !== evidence.sourceChecksum) {
          checks.evidence = false;
          issues.push("Evidence sourceChecksum does not match the current source body.");
        }
      }

      const dryRun = await runAgentDryRun(manifest);
      if (dryRun.outputHash !== evidence.dryRun.outputHash) {
        checks.evidence = false;
        issues.push("Dry-run outputHash does not match evidence.json.");
      }

      if (dryRun.output !== evidence.dryRun.output) {
        checks.evidence = false;
        issues.push("Dry-run output does not match evidence.json.");
      }

      if (dryRun.logs.join("\n") !== evidence.dryRun.logs.join("\n")) {
        checks.evidence = false;
        issues.push("Dry-run logs do not match evidence.json.");
      }

      const missingEvidenceQueries = [manifest.agent.id, manifest.agent.name].filter(
        (value) => !evidence.searchQueries.includes(value)
      );
      if (missingEvidenceQueries.length > 0) {
        checks.evidence = false;
        issues.push(`Evidence searchQueries is missing: ${missingEvidenceQueries.join(", ")}.`);
      }
    }

    for (const [check, passed] of Object.entries(checks) as Array<[ReadinessCheckName, boolean]>) {
      if (!passed) {
        failures.push(
          ...issues
            .filter((message) =>
              (check === "manifest" && /Manifest|prompt|skill|policy|tool/i.test(message)) ||
              (check === "integration" && /integration|catalog|discoverable|runtime file/i.test(message)) ||
              (check === "policy" && /Policy|action|engine/i.test(message)) ||
              (check === "adapters" && /Adapter/i.test(message)) ||
              (check === "evidence" && /Evidence|dry-run|sourceChecksum|source path/i.test(message))
            )
            .map((message) => ({
              agentId: manifest.agent.id,
              check,
              manifestPath: toPosixPath(path.relative(workspaceRoot, manifestPath)),
              message
            }))
        );
      }
    }

    results.push({
      agentId: manifest.agent.id,
      checks,
      evidencePath: toPosixPath(path.relative(workspaceRoot, evidencePath)),
      manifestPath: toPosixPath(path.relative(workspaceRoot, manifestPath)),
      readinessPath: toPosixPath(path.relative(workspaceRoot, readinessPath)),
      issues: Array.from(new Set(issues))
    });
  }

  const reportPath = path.join(reportRoot, "github-agents-v1-readiness-report.json");
  const report: GithubAgentReadinessGateReport = {
    collectionRoot: toPosixPath(path.relative(workspaceRoot, collectionRoot)),
    descriptor: {
      found: descriptorIssues.length === 0,
      issues: descriptorIssues
    },
    failures,
    generatedAt: new Date().toISOString(),
    installableCount: installableEntries.length,
    passedCount: results.filter((result) => Object.values(result.checks).every(Boolean)).length,
    reportPath: toPosixPath(path.relative(workspaceRoot, reportPath)),
    results,
    totalCount: catalog.length
  };

  await writeJson(reportPath, report);
  await writeJson(path.join(collectionRoot, "readiness-gate-report.json"), report);

  return report;
}

async function main(): Promise<void> {
  const report = await verifyGithubAgentsReadiness();

  if (report.failures.length > 0) {
    console.error(
      `[github-agents-readiness] Failed ${report.failures.length} checks across ${report.installableCount} installable manifests.`
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `[github-agents-readiness] Passed ${report.passedCount}/${report.installableCount} installable manifests. Report: ${report.reportPath}`
  );
}

if (isDirectExecution(import.meta.url)) {
  void main();
}
