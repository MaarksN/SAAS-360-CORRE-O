import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const GITHUB_AGENT_COLLECTION_DIRNAME = "github-agents-v1";
export const GITHUB_AGENT_COLLECTION_DESCRIPTOR_ID = "github-agents-v1-catalog";
export const GITHUB_AGENT_COLLECTION_NAME = "GitHub Agents Compiled Collection";
export const GITHUB_AGENT_COLLECTION_VERSION = "1.0.0";

export const REQUIRED_PROMPT_SECTIONS = [
  "IDENTIDADE E MISSAO",
  "QUANDO ACIONAR",
  "ENTRADAS OBRIGATORIAS",
  "RACIOCINIO OPERACIONAL ESPERADO",
  "MODO DE OPERACAO AUTONOMA",
  "ROTINA DE MONITORAMENTO E ANTECIPACAO",
  "CRITERIOS DE PRIORIZACAO",
  "CRITERIOS DE ESCALACAO",
  "OBJETIVOS PRIORITARIOS",
  "FERRAMENTAS ESPERADAS",
  "SAIDAS OBRIGATORIAS",
  "GUARDRAILS",
  "CHECKLIST DE QUALIDADE",
  "APRENDIZADO COMPARTILHADO",
  "FORMATO DE SAIDA"
] as const;

export const STANDARD_POLICY_ACTIONS = [
  "tool:execute",
  "memory:read",
  "memory:write",
  "learning:read",
  "learning:write",
  "audit:write",
  "report:read",
  "approval:request",
  "decision:recommend",
  "workflow:trigger"
] as const;

export interface GithubAgentSource {
  body: string;
  collaborators: string[];
  description: string;
  domainContext: string;
  frontmatter: Record<string, boolean | number | string | string[]>;
  name: string;
  outputStem: string;
  path: string;
  sections: Record<string, string>;
  tools: string[];
  userInvocable: boolean;
}

export interface GithubAgentEvidenceArtifact {
  agentId: string;
  dryRun: {
    logs: string[];
    output: string;
    outputHash: string;
  };
  generatedAt: string;
  runtimeBindings: {
    apiBinding: string;
    policyEngine: string;
    toolAdapterFactory: string;
    workerBinding: string;
  };
  searchQueries: string[];
  sourceChecksum: string;
  sourcePath: string;
}

export interface GithubAgentReadinessArtifact {
  adapters: {
    adapterFactoryPath: string;
    adapterMode: "manifest-capability-tool";
    entries: Array<{
      action: "tool:execute";
      adapterType: "ManifestCapabilityTool";
      ready: boolean;
      toolId: string;
      toolName: string;
    }>;
    ready: boolean;
  };
  collaborators: string[];
  evidence: {
    dryRunArtifactPath: string;
    generatedAt: string;
    ready: boolean;
    sourceChecksum: string;
    sourcePath: string;
  };
  integration: {
    apiBindingPath: string;
    catalogRoot: string;
    discoverableQueries: string[];
    ready: boolean;
    runtimeProvider: "manifest-runtime";
    runtimeToolsBindingPath: string;
    workerBindingPath: string;
  };
  manifest: {
    manifestPath: string;
    manifestVersion: string;
    ready: boolean;
  };
  policy: {
    enginePath: string;
    ready: boolean;
    requiredActions: string[];
    ruleCount: number;
  };
  readiness: {
    adapters: boolean;
    evidence: boolean;
    integration: boolean;
    manifest: boolean;
    overall: boolean;
    policy: boolean;
  };
}

export interface CompiledGithubAgentsSummary {
  collectionDescriptorId: string;
  collectionRoot: string;
  generatedAt: string;
  installableCount: number;
  sourceCount: number;
  totalCount: number;
}

export const KNOWN_TOOL_DESCRIPTIONS: Record<string, string> = {
  agent: "Delegar, coordenar ou consultar outro agente de forma governada.",
  edit: "Editar artefatos autorizados com rastreabilidade e controle.",
  execute: "Executar uma acao operacional governada dentro do runtime manifesto.",
  read: "Ler artefatos, contexto e evidencias necessarias para decisao.",
  search: "Pesquisar catalogos, contexto e sinais relevantes para o objetivo.",
  todo: "Gerenciar plano de execucao, backlog curto e acompanhamento de tarefas."
};

export function getWorkspaceRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

export function getGithubAgentSourceRoot(workspaceRoot = getWorkspaceRoot()): string {
  return path.join(workspaceRoot, ".github", "agents");
}

export function getGithubAgentCollectionRoot(workspaceRoot = getWorkspaceRoot()): string {
  return path.join(workspaceRoot, "packages", "agent-packs", GITHUB_AGENT_COLLECTION_DIRNAME);
}

export function isGithubAgentSourcePath(value: string): boolean {
  return toPosixPath(value).startsWith(".github/agents/");
}

export function getGithubAgentArtifactsRoot(workspaceRoot = getWorkspaceRoot()): string {
  return path.join(workspaceRoot, "artifacts", "agent-readiness");
}

export function toPosixPath(value: string): string {
  return value.replace(/\\/g, "/");
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\r/g, "").replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").trim();
}

export function stripAgentMarkdownStem(fileName: string): string {
  return fileName.replace(/\.agent\.md$/i, "");
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values.map((item) => item.trim()).filter(Boolean)) {
    const key = value.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(value);
  }

  return result;
}

export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function parseFrontmatterValue(value: string): boolean | number | string | string[] {
  const trimmed = value.trim();

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
  }

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed.replace(/^['"]|['"]$/g, "");
}

export function parseMarkdownAgentSource(
  rawText: string,
  relativePath: string
): GithubAgentSource {
  const normalized = normalizeWhitespace(rawText);
  const lines = normalized.split("\n");

  let frontmatter: Record<string, boolean | number | string | string[]> = {};
  let bodyStartIndex = 0;

  if (lines[0] === "---") {
    const closingIndex = lines.findIndex((line, index) => index > 0 && line === "---");
    if (closingIndex > 0) {
      frontmatter = {};
      for (const line of lines.slice(1, closingIndex)) {
        const separatorIndex = line.indexOf(":");
        if (separatorIndex < 0) {
          continue;
        }

        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();
        frontmatter[key] = parseFrontmatterValue(value);
      }
      bodyStartIndex = closingIndex + 1;
    }
  }

  const body = lines.slice(bodyStartIndex).join("\n").trim();
  const sections = extractMarkdownSections(body);
  const outputStem = stripAgentMarkdownStem(path.basename(relativePath));
  const name = typeof frontmatter.name === "string" ? frontmatter.name : outputStem;
  const description =
    typeof frontmatter.description === "string" ? frontmatter.description : firstMeaningfulLine(body);
  const tools = Array.isArray(frontmatter.tools)
    ? frontmatter.tools.map(String)
    : [];
  const collaborators = Array.isArray(frontmatter.agents)
    ? frontmatter.agents.map(String)
    : [];
  const domainContext =
    typeof frontmatter["domain-context"] === "string"
      ? frontmatter["domain-context"]
      : path.dirname(relativePath).split(/[\\/]/).at(-1) ?? "core";

  return {
    body,
    collaborators,
    description,
    domainContext,
    frontmatter,
    name,
    outputStem,
    path: toPosixPath(relativePath),
    sections,
    tools,
    userInvocable: frontmatter["user-invocable"] === true
  };
}

export function extractMarkdownSections(body: string): Record<string, string> {
  const sections = new Map<string, string[]>();
  const seenHeadings = new Set<string>();
  let currentHeading: string | null = null;

  for (const rawLine of body.split("\n")) {
    const line = rawLine.trimEnd();
    const headingMatch = line.match(/^##\s+(.+?)\s*$/u);

    if (headingMatch) {
      const heading = headingMatch[1].trim();
      if (/[ÃÂ�]/u.test(heading)) {
        currentHeading = null;
        continue;
      }

      if (seenHeadings.has(heading)) {
        currentHeading = null;
        continue;
      }

      seenHeadings.add(heading);
      sections.set(heading, []);
      currentHeading = heading;
      continue;
    }

    if (currentHeading) {
      sections.get(currentHeading)?.push(line);
    }
  }

  return Object.fromEntries(
    Array.from(sections.entries()).map(([heading, lines]) => [
      heading,
      normalizeWhitespace(lines.join("\n"))
    ])
  );
}

export function firstMeaningfulLine(value: string): string {
  for (const line of value.split("\n")) {
    const normalized = line.trim().replace(/^[-#*]+\s*/, "").trim();
    if (normalized.length > 0) {
      return normalized;
    }
  }

  return "";
}

export function toBulletList(block: string): string[] {
  return uniqueStrings(
    block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => {
        if (/^[-*]\s+/u.test(line)) {
          return [line.replace(/^[-*]\s+/u, "").trim()];
        }

        if (/^\d+\.\s+/u.test(line)) {
          return [line.replace(/^\d+\.\s+/u, "").trim()];
        }

        return [];
      })
  );
}

export function splitSentences(value: string): string[] {
  return uniqueStrings(
    value
      .split(/(?<=[.!?])\s+/u)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  );
}

export function titleCase(value: string): string {
  return value
    .split(/\s+/u)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function isDirectExecution(metaUrl: string): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }

  return path.resolve(entry) === path.resolve(fileURLToPath(metaUrl));
}
