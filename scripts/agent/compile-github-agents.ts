import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { AgentManifest } from "@birthub/agents-core";
import { isInstallableManifest, loadManifestCatalog, runAgentDryRun } from "@birthub/agents-core";

import {
  type CompiledGithubAgentsSummary,
  GITHUB_AGENT_COLLECTION_DESCRIPTOR_ID,
  GITHUB_AGENT_COLLECTION_DIRNAME,
  GITHUB_AGENT_COLLECTION_NAME,
  GITHUB_AGENT_COLLECTION_VERSION,
  type GithubAgentEvidenceArtifact,
  type GithubAgentReadinessArtifact,
  type GithubAgentSource,
  KNOWN_TOOL_DESCRIPTIONS,
  STANDARD_POLICY_ACTIONS,
  firstMeaningfulLine,
  getGithubAgentCollectionRoot,
  getGithubAgentSourceRoot,
  getWorkspaceRoot,
  isDirectExecution,
  parseMarkdownAgentSource,
  sha256,
  slugify,
  splitSentences,
  titleCase,
  toBulletList,
  toPosixPath,
  uniqueStrings
} from "./github-agent-collection.js";

interface CompileGithubAgentsOptions {
  cleanOutput?: boolean;
  outputRoot?: string;
  sourceRoot?: string;
  workspaceRoot?: string;
}

interface CompiledAgentArtifact {
  evidencePath: string;
  manifestPath: string;
  readinessPath: string;
  sourcePath: string;
}

const DEFAULT_INPUTS = [
  "objetivo do usuario ou evento gatilho",
  "contexto operacional relevante",
  "restricoes e limites de execucao",
  "tenant e escopo da decisao"
];

const DEFAULT_GUARDRAILS = [
  "nunca misturar dados entre tenants",
  "nunca executar acao sensivel sem rastreabilidade",
  "sempre explicitar premissas e incertezas",
  "sempre registrar proximo passo e risco relevante"
];

const DEFAULT_CHECKLIST = [
  "separar fato, inferencia e ausencia de informacao",
  "deixar proximo passo objetivo",
  "garantir rastreabilidade da recomendacao",
  "preservar seguranca e governanca"
];

const DEFAULT_AUTONOMOUS_BLOCK = [
  "operar de forma autonoma dentro do escopo permitido, sem degradar governanca",
  "monitorar sinais, dependencias e riscos antes de agir",
  "escalar quando a decisao exigir aprovacao humana"
];

const DEFAULT_REASONING_BLOCK = [
  "interpretar o objetivo real antes de agir",
  "consultar contexto disponivel e artefatos relevantes",
  "priorizar qualidade, rastreabilidade e proximo passo claro",
  "agir somente dentro de ferramentas, politicas e aprovacoes permitidas"
];

const DEFAULT_MONITORING_BLOCK = [
  "comparar baseline, tendencia e desvio observado",
  "mapear gargalos, riscos emergentes e oportunidades",
  "nunca esperar um risco relevante virar incidente para alertar",
  "reavaliar no checkpoint mais proximo com impacto material"
];

const DEFAULT_PRIORITY_BLOCK = [
  "priorizar risco alto, prazo curto e alta irreversibilidade",
  "elevar o que destrava dependencias criticas",
  "reduzir prioridade quando a confianca for baixa e o custo de agir for alto"
];

const DEFAULT_ESCALATION_BLOCK = [
  "escalar quando houver risco alto com confianca insuficiente",
  "escalar quando a acao exigir aprovacao, excecao de policy ou comunicacao sensivel",
  "escalar quando houver dependencia critica sem dono claro"
];

const DEFAULT_SHARED_LEARNING_BLOCK = [
  "Todo agente aprende com todo agente.",
  "Antes de responder, consulte aprendizados compartilhados relevantes do mesmo tenant.",
  "Depois de concluir, publique um aprendizado estruturado com summary, evidence, confidence, keywords, appliesTo e approved.",
  "Nunca reutilize aprendizado de outro tenant."
];

async function listGithubAgentMarkdownFiles(rootDir: string): Promise<string[]> {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listGithubAgentMarkdownFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".agent.md")) {
      files.push(entryPath);
    }
  }

  return files.sort();
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await readdir(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

function inferDomainTags(source: GithubAgentSource): string[] {
  const corpus = `${source.name} ${source.description} ${source.body} ${source.path}`.toLowerCase();
  const tags = new Set<string>();

  const matchesAny = (keywords: string[]) => keywords.some((keyword) => corpus.includes(keyword));

  if (matchesAny(["lead", "pipeline", "deal", "quota", "prospect", "sales", "outreach", "pricing"])) {
    tags.add("sales");
  }

  if (matchesAny(["brand", "campaign", "marketing", "creative", "persona", "positioning", "ad"])) {
    tags.add("marketing");
  }

  if (matchesAny(["cash", "budget", "finance", "forecast", "invoice", "tax", "margin", "burn"])) {
    tags.add("finance");
  }

  if (
    matchesAny([
      "churn",
      "renewal",
      "onboarding",
      "ticket",
      "qbr",
      "customer",
      "sla",
      "health score",
      "welcome"
    ])
  ) {
    tags.add("customer-success");
  }

  if (matchesAny(["compliance", "sanction", "pep", "audit", "policy", "risk", "fraud", "regulatory"])) {
    tags.add("compliance");
  }

  if (matchesAny(["security", "access", "incident", "questionnaire", "tech stack", "privacy"])) {
    tags.add("security");
  }

  if (matchesAny(["product", "feature", "user story", "requirements", "session replay"])) {
    tags.add("product");
  }

  if (matchesAny(["hr", "people", "culture", "training", "coach", "enablement", "learning"])) {
    tags.add("enablement");
  }

  if (matchesAny(["ops", "workflow", "approval", "process", "resource", "capacity", "orchestr", "planner"])) {
    tags.add("operations");
  }

  if (matchesAny(["sql", "kpi", "analy", "score", "dashboard", "model", "forecast", "attribution"])) {
    tags.add("analytics");
  }

  if (tags.size === 0) {
    tags.add(source.domainContext === "core" ? "operations" : "analytics");
  }

  return Array.from(tags).slice(0, 2);
}

function inferIndustryTags(domainTags: string[]): string[] {
  if (domainTags.includes("finance")) {
    return ["finance"];
  }

  if (domainTags.includes("compliance") || domainTags.includes("security")) {
    return ["regulated"];
  }

  if (
    domainTags.includes("sales") ||
    domainTags.includes("marketing") ||
    domainTags.includes("customer-success")
  ) {
    return ["sales"];
  }

  return ["cross-industry"];
}

function inferLevelTags(source: GithubAgentSource, domainTags: string[]): string[] {
  const lowerName = source.name.toLowerCase();

  if (source.domainContext === "core" || lowerName.includes("planner") || lowerName.includes("reviewer")) {
    return ["suite"];
  }

  if (
    lowerName.includes("manager") ||
    lowerName.includes("director") ||
    lowerName.includes("architect") ||
    lowerName.includes("executive")
  ) {
    return ["department"];
  }

  if (domainTags.includes("finance") || domainTags.includes("security") || domainTags.includes("compliance")) {
    return ["specialist"];
  }

  return ["specialist"];
}

function deriveMission(source: GithubAgentSource): string {
  const firstLine = firstMeaningfulLine(source.body);
  if (firstLine) {
    return firstLine.replace(/^Você é\s+/u, "").replace(/^You are\s+/u, "").trim();
  }

  return source.description || `Executar o papel de ${source.name} com governanca e rastreabilidade.`;
}

function deriveWhenToUse(source: GithubAgentSource): string[] {
  const rawDescription = source.description.trim();
  const values: string[] = [];

  if (/^use when /iu.test(rawDescription)) {
    values.push(rawDescription.replace(/^use when /iu, ""));
  } else if (rawDescription) {
    values.push(rawDescription);
  }

  const scopeBullets = toBulletList(source.sections.Escopo ?? "");
  values.push(...scopeBullets.map((item) => `quando for necessario ${item.replace(/\.$/u, "")}`));

  if (values.length === 0) {
    values.push(`quando ${source.name} precisar atuar dentro do fluxo governado`);
  }

  return uniqueStrings(values).slice(0, 6);
}

function deriveInputs(source: GithubAgentSource): string[] {
  const values = [
    ...toBulletList(source.sections["Entradas Obrigatórias"] ?? ""),
    ...splitSentences(source.sections["Foco de Domínio"] ?? "")
  ];

  return uniqueStrings([...DEFAULT_INPUTS, ...values]).slice(0, 8);
}

function deriveObjectives(source: GithubAgentSource): string[] {
  const values = [
    ...toBulletList(source.sections.Escopo ?? ""),
    ...toBulletList(source.sections["Saída Obrigatória"] ?? ""),
    ...splitSentences(source.description)
  ].map((item) => item.replace(/\.$/u, ""));

  if (values.length === 0) {
    values.push(`executar o objetivo principal de ${source.name}`);
  }

  return uniqueStrings(values).slice(0, 6);
}

function deriveOutputs(source: GithubAgentSource, objectives: string[]): string[] {
  const sectionOutputs = toBulletList(source.sections["Saída Obrigatória"] ?? "");
  const collaboratorOutputs =
    source.collaborators.length > 0
      ? [`handoff governado para ${source.collaborators.join(", ")}`]
      : [];

  return uniqueStrings([
    ...sectionOutputs,
    ...collaboratorOutputs,
    ...objectives.map((item) => item.replace(/^executar /iu, "")),
    "alertas preventivos priorizados",
    "decisoes que precisam ser antecipadas",
    "plano preventivo com dono, prazo e checkpoint",
    "proximo passo recomendado"
  ]).slice(0, 8);
}

function deriveGuardrails(source: GithubAgentSource): string[] {
  return uniqueStrings([
    ...toBulletList(source.sections.Restrições ?? ""),
    ...toBulletList(source.sections["Fallback e Recuperação"] ?? ""),
    ...toBulletList(source.sections["Segurança de Execução"] ?? ""),
    ...DEFAULT_GUARDRAILS
  ]).slice(0, 10);
}

function deriveQualityChecklist(source: GithubAgentSource): string[] {
  return uniqueStrings([
    ...toBulletList(source.sections["Critérios de Decisão"] ?? ""),
    ...toBulletList(source.sections["Sugestões Proativas"] ?? ""),
    ...DEFAULT_CHECKLIST
  ]).slice(0, 8);
}

function buildSkills(agentId: string, objectives: string[]): AgentManifest["skills"] {
  const selected = objectives.slice(0, 6);

  return selected.map((objective, index) => ({
    description: objective,
    id: `${agentId}.skill.${index + 1}-${slugify(objective).slice(0, 48) || "capability"}`,
    inputSchema: { type: "object" },
    name: titleCase(objective.replace(/[.:]/gu, "")),
    outputSchema: { type: "object" }
  }));
}

function buildTools(agentId: string, toolNames: string[]): AgentManifest["tools"] {
  const values = toolNames.length > 0 ? toolNames : ["read", "search", "agent"];

  return uniqueStrings(values).map((toolName) => ({
    description:
      KNOWN_TOOL_DESCRIPTIONS[toolName] ??
      `Executar a capacidade operacional '${toolName}' de forma governada e rastreavel.`,
    id: `${agentId}.tool.${slugify(toolName)}`,
    inputSchema: { type: "object" },
    name: titleCase(toolName.replace(/[-_]/gu, " ")),
    outputSchema: { type: "object" },
    timeoutMs: 15_000
  }));
}

function buildOutputFormat(agentId: string, outputs: string[]): string {
  const deliverables = outputs.slice(0, 6).map((item) => `    "${item}"`).join(",\n");

  return `{
  "agent_id": "${agentId}",
  "summary": "",
  "status": "stable | watch | critical",
  "leading_indicators": [],
  "emerging_risks": [],
  "opportunities_to_capture": [],
  "decisions_to_anticipate": [],
  "preventive_action_plan": [],
  "specialist_deliverables": [
${deliverables}
  ],
  "approvals_or_dependencies": [],
  "next_checkpoint": "",
  "confidence": "low | medium | high"
}`;
}

function renderPrompt(input: {
  agentId: string;
  collaborators: string[];
  guardrails: string[];
  inputs: string[];
  mission: string;
  name: string;
  objectives: string[];
  outputs: string[];
  qualityChecklist: string[];
  toolNames: string[];
  whenToUse: string[];
}): string {
  const collaboratorGuardrail =
    input.collaborators.length > 0
      ? [`coordenar handoff com ${input.collaborators.join(", ")} quando houver especialidade complementar`]
      : [];

  return [
    `Voce e o ${input.name} da GitHub Agents Compiled Collection.`,
    "",
    "IDENTIDADE E MISSAO",
    input.mission,
    "",
    "QUANDO ACIONAR",
    ...input.whenToUse.map((item) => `- ${item}`),
    "",
    "ENTRADAS OBRIGATORIAS",
    ...input.inputs.map((item) => `- ${item}`),
    "",
    "RACIOCINIO OPERACIONAL ESPERADO",
    ...DEFAULT_REASONING_BLOCK.map((item) => `- ${item}`),
    "",
    "MODO DE OPERACAO AUTONOMA",
    ...DEFAULT_AUTONOMOUS_BLOCK.map((item) => `- ${item}`),
    "",
    "ROTINA DE MONITORAMENTO E ANTECIPACAO",
    ...DEFAULT_MONITORING_BLOCK.map((item) => `- ${item}`),
    "",
    "CRITERIOS DE PRIORIZACAO",
    ...DEFAULT_PRIORITY_BLOCK.map((item) => `- ${item}`),
    "",
    "CRITERIOS DE ESCALACAO",
    ...DEFAULT_ESCALATION_BLOCK.map((item) => `- ${item}`),
    "",
    "OBJETIVOS PRIORITARIOS",
    ...input.objectives.map((item) => `- ${item}`),
    "",
    "FERRAMENTAS ESPERADAS",
    ...input.toolNames.map((item) => `- ${item}`),
    "",
    "SAIDAS OBRIGATORIAS",
    ...input.outputs.map((item) => `- ${item}`),
    "",
    "GUARDRAILS",
    ...uniqueStrings([...input.guardrails, ...collaboratorGuardrail]).map((item) => `- ${item}`),
    "",
    "CHECKLIST DE QUALIDADE",
    ...input.qualityChecklist.map((item) => `- ${item}`),
    "",
    "APRENDIZADO COMPARTILHADO",
    ...DEFAULT_SHARED_LEARNING_BLOCK.map((item) => `- ${item}`),
    "",
    "FORMATO DE SAIDA",
    buildOutputFormat(input.agentId, input.outputs)
  ].join("\n");
}

function buildManifest(source: GithubAgentSource, agentId: string): AgentManifest {
  const domainTags = inferDomainTags(source);
  const mission = deriveMission(source);
  const whenToUse = deriveWhenToUse(source);
  const inputs = deriveInputs(source);
  const objectives = deriveObjectives(source);
  const outputs = deriveOutputs(source, objectives);
  const guardrails = deriveGuardrails(source);
  const qualityChecklist = deriveQualityChecklist(source);
  const tools = buildTools(agentId, source.tools);
  const toolNames = tools.map((tool) => tool.name);
  const prompt = renderPrompt({
    agentId,
    collaborators: source.collaborators,
    guardrails,
    inputs,
    mission,
    name: source.name,
    objectives,
    outputs,
    qualityChecklist,
    toolNames,
    whenToUse
  });

  const persona = slugify(source.name.replace(/\s+agent$/iu, "").replace(/\s+bot$/iu, ""));

  return {
    agent: {
      changelog: [
        `${GITHUB_AGENT_COLLECTION_VERSION} - Compiled from ${source.path} into manifest-runtime collection`
      ],
      description: source.description || mission,
      id: agentId,
      kind: "agent",
      name: source.name,
      prompt,
      tenantId: "catalog",
      version: GITHUB_AGENT_COLLECTION_VERSION
    },
    keywords: uniqueStrings([
      slugify(source.name).replace(/-/gu, " "),
      source.domainContext,
      ...domainTags,
      ...source.tools,
      ...source.collaborators,
      ...objectives.map((item) => item.toLowerCase()),
      "github agents",
      "compiled manifest",
      "manifest runtime"
    ]).slice(0, 20),
    manifestVersion: "1.0.0",
    policies: [
      {
        actions: Array.from(STANDARD_POLICY_ACTIONS),
        effect: "allow",
        id: `${agentId}.policy.standard`,
        name: "Compiled GitHub agent governed execution policy"
      }
    ],
    skills: buildSkills(agentId, objectives),
    tags: {
      domain: domainTags,
      industry: inferIndustryTags(domainTags),
      level: inferLevelTags(source, domainTags),
      persona: [persona || slugify(source.outputStem)],
      "use-case": uniqueStrings([persona || slugify(source.outputStem), "github-source-compiled"]).slice(0, 4)
    },
    tools
  };
}

function buildCollectionDescriptorManifest(installableCount: number): AgentManifest {
  return {
    agent: {
      changelog: [
        `${GITHUB_AGENT_COLLECTION_VERSION} - Descriptor updated for ${installableCount} compiled GitHub agents`
      ],
      description: "Catalog descriptor for the compiled .github/agents collection routed through manifest-runtime.",
      id: GITHUB_AGENT_COLLECTION_DESCRIPTOR_ID,
      kind: "catalog",
      name: GITHUB_AGENT_COLLECTION_NAME,
      prompt:
        "Expose, segment and document the compiled GitHub agents collection with manifest, readiness and dry-run evidence.",
      tenantId: "catalog",
      version: GITHUB_AGENT_COLLECTION_VERSION
    },
    keywords: [
      "github agents",
      "compiled collection",
      "manifest runtime",
      "catalog",
      "readiness",
      "dry run evidence"
    ],
    manifestVersion: "1.0.0",
    policies: [
      {
        actions: ["report:read", "audit:write"],
        effect: "allow",
        id: `${GITHUB_AGENT_COLLECTION_DESCRIPTOR_ID}.policy.catalog`,
        name: "Compiled collection governance policy"
      }
    ],
    skills: [
      {
        description: "Expose compiled collection metadata and readiness coverage.",
        id: `${GITHUB_AGENT_COLLECTION_DESCRIPTOR_ID}.skill.collection-governance`,
        inputSchema: { type: "object" },
        name: "Collection Governance",
        outputSchema: { type: "object" }
      }
    ],
    tags: {
      domain: ["governance"],
      industry: ["cross-industry"],
      level: ["suite"],
      persona: ["catalog-admin"],
      "use-case": ["discover", "compiled-github-agents"]
    },
    tools: [
      {
        description: "Expose compiled collection metadata for marketplace and readiness surfaces.",
        id: `${GITHUB_AGENT_COLLECTION_DESCRIPTOR_ID}.tool.collection-index`,
        inputSchema: { type: "object" },
        name: "Collection Index",
        outputSchema: { type: "object" },
        timeoutMs: 15_000
      }
    ]
  };
}

function buildEvidenceArtifact(
  workspaceRoot: string,
  manifest: AgentManifest,
  source: GithubAgentSource,
  dryRun: Awaited<ReturnType<typeof runAgentDryRun>>
): GithubAgentEvidenceArtifact {
  const sourcePath = path.join(workspaceRoot, source.path);

  return {
    agentId: manifest.agent.id,
    dryRun,
    generatedAt: new Date().toISOString(),
    runtimeBindings: {
      apiBinding: "apps/api/src/modules/marketplace/marketplace-service.ts",
      policyEngine: "packages/agents-core/src/policy/engine.ts",
      toolAdapterFactory: "apps/worker/src/agents/runtime.tools.ts",
      workerBinding: "apps/worker/src/agents/runtime.shared.ts"
    },
    searchQueries: [manifest.agent.id, manifest.agent.name],
    sourceChecksum: sha256(source.body),
    sourcePath: toPosixPath(path.relative(workspaceRoot, sourcePath))
  };
}

function buildReadinessArtifact(input: {
  collectionRoot: string;
  evidence: GithubAgentEvidenceArtifact;
  manifest: AgentManifest;
  manifestPath: string;
  readinessPath: string;
  workspaceRoot: string;
}): GithubAgentReadinessArtifact {
  const adapterEntries = input.manifest.tools.map((tool) => ({
    action: "tool:execute" as const,
    adapterType: "ManifestCapabilityTool" as const,
    ready: true,
    toolId: tool.id,
    toolName: tool.name
  }));
  const relativeCollectionRoot = toPosixPath(path.relative(input.workspaceRoot, input.collectionRoot));

  return {
    adapters: {
      adapterFactoryPath: "apps/worker/src/agents/runtime.tools.ts",
      adapterMode: "manifest-capability-tool",
      entries: adapterEntries,
      ready: adapterEntries.length === input.manifest.tools.length && adapterEntries.length > 0
    },
    collaborators: [],
    evidence: {
      dryRunArtifactPath: toPosixPath(
        path.relative(input.workspaceRoot, path.join(path.dirname(input.readinessPath), "evidence.json"))
      ),
      generatedAt: input.evidence.generatedAt,
      ready: true,
      sourceChecksum: input.evidence.sourceChecksum,
      sourcePath: input.evidence.sourcePath
    },
    integration: {
      apiBindingPath: "apps/api/src/modules/marketplace/marketplace-service.ts",
      catalogRoot: relativeCollectionRoot,
      discoverableQueries: input.evidence.searchQueries,
      ready: true,
      runtimeProvider: "manifest-runtime",
      runtimeToolsBindingPath: "apps/worker/src/agents/runtime.tools.ts",
      workerBindingPath: "apps/worker/src/agents/runtime.shared.ts"
    },
    manifest: {
      manifestPath: toPosixPath(path.relative(input.workspaceRoot, input.manifestPath)),
      manifestVersion: input.manifest.manifestVersion,
      ready: true
    },
    policy: {
      enginePath: "packages/agents-core/src/policy/engine.ts",
      ready: true,
      requiredActions: Array.from(STANDARD_POLICY_ACTIONS),
      ruleCount: input.manifest.policies.reduce((total, policy) => total + policy.actions.length, 0)
    },
    readiness: {
      adapters: true,
      evidence: true,
      integration: true,
      manifest: true,
      overall: true,
      policy: true
    }
  };
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function rewriteCompiledCollectionArtifacts(input: {
  collectionRoot: string;
  workspaceRoot: string;
}): Promise<void> {
  const catalog = await loadManifestCatalog(input.collectionRoot);
  const installableEntries = catalog.filter((entry) => isInstallableManifest(entry.manifest));
  const artifacts: CompiledAgentArtifact[] = [];

  for (const entry of installableEntries) {
    const agentDir = path.dirname(entry.manifestPath);
    const evidencePath = path.join(agentDir, "evidence.json");
    const readinessPath = path.join(agentDir, "readiness.json");
    const evidence = await readJson<GithubAgentEvidenceArtifact>(evidencePath);
    const existingReadiness = await readJson<GithubAgentReadinessArtifact>(readinessPath);
    const readiness = buildReadinessArtifact({
      collectionRoot: input.collectionRoot,
      evidence,
      manifest: entry.manifest,
      manifestPath: entry.manifestPath,
      readinessPath,
      workspaceRoot: input.workspaceRoot
    });

    readiness.collaborators = existingReadiness.collaborators;

    await writeJson(readinessPath, readiness);

    artifacts.push({
      evidencePath,
      manifestPath: entry.manifestPath,
      readinessPath,
      sourcePath: evidence.sourcePath
    });
  }

  await writeJson(path.join(input.collectionRoot, "collection-report.json"), {
    artifacts: artifacts.map((artifact) => ({
      evidencePath: toPosixPath(path.relative(input.workspaceRoot, artifact.evidencePath)),
      manifestPath: toPosixPath(path.relative(input.workspaceRoot, artifact.manifestPath)),
      readinessPath: toPosixPath(path.relative(input.workspaceRoot, artifact.readinessPath)),
      sourcePath: artifact.sourcePath
    })),
    collectionDescriptorId: GITHUB_AGENT_COLLECTION_DESCRIPTOR_ID,
    collectionName: GITHUB_AGENT_COLLECTION_NAME,
    generatedAt: new Date().toISOString(),
    installableCount: artifacts.length,
    totalCount: artifacts.length + 1
  });
}

export async function compileGithubAgentsCollection(
  options: CompileGithubAgentsOptions = {}
): Promise<CompiledGithubAgentsSummary> {
  const workspaceRoot = options.workspaceRoot ?? getWorkspaceRoot();
  const sourceRoot = options.sourceRoot ?? getGithubAgentSourceRoot(workspaceRoot);
  const collectionRoot = options.outputRoot ?? getGithubAgentCollectionRoot(workspaceRoot);
  const canonicalCollectionRoot = getGithubAgentCollectionRoot(workspaceRoot);
  const sourceFiles =
    (await pathExists(sourceRoot)) ? await listGithubAgentMarkdownFiles(sourceRoot) : [];

  if (sourceFiles.length === 0) {
    if (!(await pathExists(canonicalCollectionRoot))) {
      throw new Error(
        `GitHub agent source root '${toPosixPath(path.relative(workspaceRoot, sourceRoot))}' is missing and no canonical compiled collection is available.`
      );
    }

    if (path.resolve(canonicalCollectionRoot) !== path.resolve(collectionRoot)) {
      if (options.cleanOutput ?? true) {
        await rm(collectionRoot, { force: true, recursive: true });
      }
      await mkdir(path.dirname(collectionRoot), { recursive: true });
      await cp(canonicalCollectionRoot, collectionRoot, { recursive: true, force: true });
      await rewriteCompiledCollectionArtifacts({
        collectionRoot,
        workspaceRoot
      });
    }

    const catalog = await loadManifestCatalog(collectionRoot);
    const installableCount = catalog.filter((entry) => isInstallableManifest(entry.manifest)).length;

    return {
      collectionDescriptorId: GITHUB_AGENT_COLLECTION_DESCRIPTOR_ID,
      collectionRoot,
      generatedAt: new Date().toISOString(),
      installableCount,
      sourceCount: installableCount,
      totalCount: catalog.length
    };
  }

  if (options.cleanOutput ?? true) {
    await rm(collectionRoot, { force: true, recursive: true });
  }
  const idCounts = new Map<string, number>();
  const artifacts: CompiledAgentArtifact[] = [];

  for (const sourceFile of sourceFiles) {
    const relativeSourcePath = toPosixPath(path.relative(workspaceRoot, sourceFile));
    const raw = await readFile(sourceFile, "utf8");
    const source = parseMarkdownAgentSource(raw, relativeSourcePath);
    const baseId = `${slugify(source.outputStem)}-github-pack`;
    const occurrence = (idCounts.get(baseId) ?? 0) + 1;
    idCounts.set(baseId, occurrence);
    const agentId = occurrence > 1 ? `${baseId}-${occurrence}` : baseId;
    const manifest = buildManifest(source, agentId);
    const agentDir = path.join(collectionRoot, agentId);
    const manifestPath = path.join(agentDir, "manifest.json");
    const evidencePath = path.join(agentDir, "evidence.json");
    const readinessPath = path.join(agentDir, "readiness.json");

    const dryRun = await runAgentDryRun(manifest);
    const evidence = buildEvidenceArtifact(workspaceRoot, manifest, source, dryRun);
    const readiness = buildReadinessArtifact({
      collectionRoot,
      evidence,
      manifest,
      manifestPath,
      readinessPath,
      workspaceRoot
    });

    readiness.collaborators = source.collaborators.map((collaborator) => `${slugify(collaborator)}-github-pack`);

    await writeJson(manifestPath, manifest);
    await writeJson(evidencePath, evidence);
    await writeJson(readinessPath, readiness);

    artifacts.push({
      evidencePath,
      manifestPath,
      readinessPath,
      sourcePath: source.path
    });
  }

  const collectionDescriptor = buildCollectionDescriptorManifest(artifacts.length);
  await writeJson(path.join(collectionRoot, "manifest.json"), collectionDescriptor);
  await writeJson(path.join(collectionRoot, "collection-report.json"), {
    artifacts: artifacts.map((artifact) => ({
      evidencePath: toPosixPath(path.relative(workspaceRoot, artifact.evidencePath)),
      manifestPath: toPosixPath(path.relative(workspaceRoot, artifact.manifestPath)),
      readinessPath: toPosixPath(path.relative(workspaceRoot, artifact.readinessPath)),
      sourcePath: artifact.sourcePath
    })),
    collectionDescriptorId: GITHUB_AGENT_COLLECTION_DESCRIPTOR_ID,
    collectionName: GITHUB_AGENT_COLLECTION_NAME,
    generatedAt: new Date().toISOString(),
    installableCount: artifacts.length,
    totalCount: artifacts.length + 1
  });

  return {
    collectionDescriptorId: GITHUB_AGENT_COLLECTION_DESCRIPTOR_ID,
    collectionRoot,
    generatedAt: new Date().toISOString(),
    installableCount: artifacts.length,
    sourceCount: sourceFiles.length,
    totalCount: artifacts.length + 1
  };
}

async function main(): Promise<void> {
  const summary = await compileGithubAgentsCollection();
  console.log(
    `[github-agents-compiler] Compiled ${summary.installableCount}/${summary.sourceCount} GitHub agents into ${toPosixPath(
      path.relative(getWorkspaceRoot(), summary.collectionRoot)
    )}`
  );
}

if (isDirectExecution(import.meta.url)) {
  void main();
}
