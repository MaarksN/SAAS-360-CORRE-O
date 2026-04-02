import { prisma } from "@birthub/database";
import { existsSync } from "node:fs";
import path from "node:path";
import { findManifestCatalogEntryByAgentId, loadManifestCatalog, type ManifestCatalogEntry, type AgentManifest, type ManagedAgentPolicy } from "@birthub/agents-core";

export interface AgentConfigSnapshot {
  managedPolicies: ManagedAgentPolicy[];
  runtimeProvider: "manifest-runtime" | "python-orchestrator";
  sourceAgentId: string | null;
}

export interface RuntimeAgentResolution {
  installedAgentId: string | null;
  manifest: AgentManifest;
  organizationId: string | null;
  runtimeAgentId: string;
}

function resolveCatalogRoot(): string {
  const candidates = [
    path.join(process.cwd(), "packages", "agent-packs"),
    path.join(process.cwd(), "..", "..", "packages", "agent-packs"),
    path.join(process.cwd(), "..", "packages", "agent-packs")
  ];

  const found = candidates.find((candidate) => existsSync(candidate));

  if (!found) {
    throw new Error("Unable to locate packages/agent-packs directory.");
  }

  return found;
}

let manifestCatalogCache:
  | {
      entries: ManifestCatalogEntry[];
      loadedAt: number;
    }
  | null = null;

export async function getManifestCatalog(): Promise<ManifestCatalogEntry[]> {
  const now = Date.now();
  if (manifestCatalogCache && now - manifestCatalogCache.loadedAt < 60_000) {
    return manifestCatalogCache.entries;
  }

  const entries = await loadManifestCatalog(resolveCatalogRoot());
  manifestCatalogCache = {
    entries,
    loadedAt: now
  };

  return entries;
}

export function parseAgentConfig(config: unknown): AgentConfigSnapshot {
  if (!config || typeof config !== "object") {
    return {
      managedPolicies: [],
      runtimeProvider: "manifest-runtime",
      sourceAgentId: null
    };
  }

  const candidate = config as Record<string, unknown>;
  const managedPolicies = Array.isArray(candidate.managedPolicies)
    ? candidate.managedPolicies
        .filter((value): value is ManagedAgentPolicy => {
          if (!value || typeof value !== "object") {
            return false;
          }

          const policy = value as Record<string, unknown>;
          return (
            typeof policy.id === "string" &&
            typeof policy.name === "string" &&
            typeof policy.effect === "string" &&
            Array.isArray(policy.actions)
          );
        })
        .map((policy) => {
          const effect: ManagedAgentPolicy["effect"] =
            policy.effect === "deny" ? "deny" : "allow";

          return {
            actions: policy.actions.filter((value): value is string => typeof value === "string"),
            effect,
            id: policy.id,
            name: policy.name,
            ...(typeof policy.enabled === "boolean" ? { enabled: policy.enabled } : {}),
            ...(typeof policy.reason === "string" ? { reason: policy.reason } : {})
          } satisfies ManagedAgentPolicy;
        })
    : [];
  const runtime =
    candidate.runtime && typeof candidate.runtime === "object" && candidate.runtime !== null
      ? (candidate.runtime as Record<string, unknown>)
      : {};
  const runtimeProvider =
    runtime.provider === "python-orchestrator" ? "python-orchestrator" : "manifest-runtime";

  return {
    managedPolicies,
    runtimeProvider,
    sourceAgentId: typeof candidate.sourceAgentId === "string" ? candidate.sourceAgentId : null
  };
}

export async function resolveRuntimeAgent(input: {
  agentId: string;
  catalogAgentId?: string | null;
  tenantId: string;
}): Promise<RuntimeAgentResolution> {
  const catalog = await getManifestCatalog();
  const installedAgent = await prisma.agent.findFirst({
    where: {
      id: input.agentId,
      tenantId: input.tenantId
    }
  });
  const installedConfig = installedAgent ? parseAgentConfig(installedAgent.config) : null;
  const resolvedCatalogAgentId =
    input.catalogAgentId ??
    installedConfig?.sourceAgentId ??
    input.agentId;
  const catalogEntry = findManifestCatalogEntryByAgentId(catalog, resolvedCatalogAgentId);

  if (!catalogEntry) {
    throw new Error(`Catalog manifest '${resolvedCatalogAgentId}' was not found.`);
  }

  return {
    installedAgentId: installedAgent?.id ?? null,
    manifest: catalogEntry.manifest,
    organizationId: installedAgent?.organizationId ?? null,
    runtimeAgentId: installedAgent?.id ?? input.agentId
  };
}

export async function resolveManagedPolicies(input: {
  installedAgentId: string | null;
  tenantId: string;
}): Promise<ManagedAgentPolicy[]> {
  if (!input.installedAgentId) {
    return [];
  }

  const agent = await prisma.agent.findFirst({
    where: {
      id: input.installedAgentId,
      tenantId: input.tenantId
    }
  });

  if (!agent) {
    return [];
  }

  return parseAgentConfig(agent.config).managedPolicies;
}
