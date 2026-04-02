import { getWebConfig } from "@birthub/config";
import { cookies } from "next/headers";

export type ExecutionStatus = "FAILED" | "RUNNING" | "SUCCESS";

export interface AgentExecutionRow {
  durationMs: number;
  id: string;
  mode: "DRY_RUN" | "LIVE" | "UNKNOWN";
  startedAt: string;
  status: ExecutionStatus;
}

export interface AgentSnapshot {
  catalogAgentId: string;
  connectors: Record<string, unknown>;
  executionCount: number;
  executions: AgentExecutionRow[];
  failRate: number;
  id: string;
  keywords: string[];
  lastRun: string | null;
  logs: string[];
  manifest: Record<string, unknown>;
  name: string;
  promptVersions: string[];
  runtimeProvider: "manifest-runtime" | "python-orchestrator";
  sourceStatus: string;
  status: string;
  tags: string[];
  version: string;
}

interface InstalledAgentsResponse {
  agents: AgentSnapshot[];
  requestId: string;
}

interface InstalledAgentResponse {
  agent: AgentSnapshot;
  requestId: string;
}

export interface ManagedPolicySnapshot {
  actions: string[];
  effect: "allow" | "deny";
  enabled?: boolean;
  id: string;
  name: string;
  reason?: string;
}

export interface AgentPoliciesSnapshot {
  managedPolicies: ManagedPolicySnapshot[];
  manifestPolicies: Array<{
    actions: string[];
    effect: string;
    id: string;
    name: string;
  }>;
  runtimeProvider: "manifest-runtime" | "python-orchestrator";
}

const agentStudioFixture: AgentSnapshot[] = [
  {
    catalogAgentId: "catalog-growth-analyst",
    connectors: {
      hubspot: true,
      slack: true
    },
    executionCount: 4,
    executions: [
      {
        durationMs: 812,
        id: "exec-agent-e2e-1",
        mode: "LIVE",
        startedAt: "2026-03-30T11:58:00.000Z",
        status: "SUCCESS"
      },
      {
        durationMs: 1330,
        id: "exec-agent-e2e-2",
        mode: "LIVE",
        startedAt: "2026-03-30T12:10:00.000Z",
        status: "FAILED"
      }
    ],
    failRate: 0.25,
    id: "agent-e2e",
    keywords: ["growth", "pipeline", "signal"],
    lastRun: "2026-03-30T12:10:00.000Z",
    logs: ["budget approved", "crm sync complete"],
    manifest: {
      agent: {
        description: "Analisa sinais de pipeline e prepara resposta operacional com memoria compartilhada.",
        prompt: "Voce e um agente de growth orientado a execucao. Priorize contexto real, risco, orquestracao e saida objetiva."
      },
      policies: [
        {
          actions: ["tool:execute", "output:write"],
          effect: "allow",
          id: "policy-default",
          name: "Default runtime policy"
        }
      ]
    },
    name: "Growth Analyst",
    promptVersions: [],
    runtimeProvider: "manifest-runtime",
    sourceStatus: "SYNCED",
    status: "ACTIVE",
    tags: ["growth", "ops"],
    version: "1.4.0"
  }
];

const agentStudioPoliciesFixture: AgentPoliciesSnapshot = {
  managedPolicies: [
    {
      actions: ["tool:execute", "output:write"],
      effect: "allow",
      enabled: true,
      id: "managed-default",
      name: "Managed default"
    }
  ],
  manifestPolicies: [
    {
      actions: ["tool:execute", "output:write"],
      effect: "allow",
      id: "policy-default",
      name: "Default runtime policy"
    }
  ],
  runtimeProvider: "manifest-runtime"
};

function shouldUseAgentStudioFixture(): boolean {
  return process.env.E2E_AGENT_STUDIO_FIXTURE === "1";
}

function normalizePromptVersions(manifest: Record<string, unknown>): string[] {
  const manifestAgent =
    "agent" in manifest && typeof manifest.agent === "object" && manifest.agent !== null
      ? (manifest.agent as Record<string, unknown>)
      : null;
  const prompt = manifestAgent?.prompt;

  if (typeof prompt === "string" && prompt.trim().length > 0) {
    return [prompt];
  }

  return ["Prompt indisponivel neste ambiente."];
}

function normalizeAgent(agent: AgentSnapshot): AgentSnapshot {
  return {
    ...agent,
    promptVersions:
      Array.isArray(agent.promptVersions) && agent.promptVersions.length > 0
        ? agent.promptVersions
        : normalizePromptVersions(agent.manifest)
  };
}

async function fetchJson<T>(path: string): Promise<T> {
  const config = getWebConfig();
  const cookieStore = typeof window === "undefined" ? await cookies() : null;
  const requestInit: RequestInit = {
    cache: "no-store",
    ...(typeof window === "undefined" ? {} : { credentials: "include" }),
    ...(cookieStore ? { headers: { cookie: cookieStore.toString() } } : {})
  };
  const response = await fetch(`${config.NEXT_PUBLIC_API_URL}${path}`, requestInit);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function listInstalledAgents(): Promise<AgentSnapshot[]> {
  if (shouldUseAgentStudioFixture()) {
    return agentStudioFixture.map((agent) => normalizeAgent(agent));
  }

  try {
    const payload = await fetchJson<InstalledAgentsResponse>("/api/v1/agents/installed");
    return payload.agents.map((agent) => normalizeAgent(agent));
  } catch {
    return [];
  }
}

export async function getInstalledAgentById(id: string): Promise<AgentSnapshot | null> {
  if (shouldUseAgentStudioFixture()) {
    const agent = agentStudioFixture.find((item) => item.id === id);
    return agent ? normalizeAgent(agent) : null;
  }

  try {
    const payload = await fetchJson<InstalledAgentResponse>(`/api/v1/agents/installed/${encodeURIComponent(id)}`);
    return normalizeAgent(payload.agent);
  } catch {
    return null;
  }
}

export async function getInstalledAgentPolicies(id: string): Promise<AgentPoliciesSnapshot | null> {
  if (shouldUseAgentStudioFixture()) {
    return agentStudioFixture.some((agent) => agent.id === id)
      ? agentStudioPoliciesFixture
      : null;
  }

  try {
    const payload = await fetchJson<{
      policies: AgentPoliciesSnapshot;
      requestId: string;
    }>(`/api/v1/agents/installed/${encodeURIComponent(id)}/policies`);
    return payload.policies;
  } catch {
    return null;
  }
}
