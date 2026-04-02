import {
  findManifestCatalogEntryByAgentId,
  type ManagedAgentPolicy
} from "@birthub/agents-core";
import { prisma } from "@birthub/database";

import {
  getManifestCatalog,
  parseAgentConfig
} from "./runtime.shared.js";
import type { RuntimeAgentResolution } from "./runtime.types.js";

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
