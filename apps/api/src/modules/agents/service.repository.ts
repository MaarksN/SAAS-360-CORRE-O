import { prisma } from "@birthub/database";

import { ProblemDetailsError } from "../../lib/problem-details.js";
import { marketplaceService } from "../marketplace/marketplace-service.js";
import { parseAgentConfig } from "./service.config.js";
import { canFallbackDatabase, extractPayloadHash } from "./service.snapshot.js";
import type {
  AgentExecutionRecord,
  OrganizationRecord,
  ResolvedInstalledAgent
} from "./service.types.js";

export async function resolveOrganization(
  tenantReference: string
): Promise<OrganizationRecord> {
  const tenantId = tenantReference.trim();

  if (!tenantId) {
    throw new ProblemDetailsError({
      detail: "Authenticated tenant context is required for installed-agent operations.",
      status: 401,
      title: "Unauthorized"
    });
  }

  try {
    const organization = await prisma.organization.findFirst({
      where: {
        OR: [{ id: tenantId }, { slug: tenantId }, { tenantId }]
      }
    });

    if (!organization) {
      throw new ProblemDetailsError({
        detail: `Tenant ${tenantId} was not found.`,
        status: 404,
        title: "Tenant Not Found"
      });
    }

    return organization;
  } catch (error) {
    if (canFallbackDatabase(error)) {
      throw new ProblemDetailsError({
        detail: "Database is unavailable for installed-agent operations.",
        status: 503,
        title: "Service Unavailable"
      });
    }

    throw error;
  }
}

export async function resolveInstalledAgent(input: {
  installedAgentId: string;
  tenantReference: string;
}): Promise<ResolvedInstalledAgent> {
  const organization = await resolveOrganization(input.tenantReference);
  const agent = await prisma.agent.findFirst({
    where: {
      id: input.installedAgentId,
      tenantId: organization.tenantId
    }
  });

  if (!agent) {
    throw new ProblemDetailsError({
      detail: `Installed agent ${input.installedAgentId} was not found for tenant ${organization.tenantId}.`,
      status: 404,
      title: "Installed Agent Not Found"
    });
  }

  const config = parseAgentConfig(agent.config);

  if (!config.sourceAgentId) {
    throw new ProblemDetailsError({
      detail: `Installed agent ${input.installedAgentId} does not declare a sourceAgentId.`,
      status: 409,
      title: "Installed Agent Misconfigured"
    });
  }

  const catalogEntry = await marketplaceService.getAgentById(config.sourceAgentId);

  if (!catalogEntry) {
    throw new ProblemDetailsError({
      detail: `Catalog agent ${config.sourceAgentId} was not found for installed agent ${input.installedAgentId}.`,
      status: 404,
      title: "Catalog Agent Not Found"
    });
  }

  return {
    agent,
    config,
    manifest: catalogEntry.manifest,
    organization
  };
}

export async function findReusableRunningExecution(input: {
  agentId: string;
  payloadHash: string;
  tenantId: string;
}): Promise<AgentExecutionRecord | null> {
  const execution = await prisma.agentExecution.findFirst({
    orderBy: {
      startedAt: "desc"
    },
    where: {
      agentId: input.agentId,
      startedAt: {
        gte: new Date(Date.now() - 10 * 60 * 1000)
      },
      status: "RUNNING",
      tenantId: input.tenantId
    }
  });

  if (!execution) {
    return null;
  }

  return extractPayloadHash(execution.metadata) === input.payloadHash ? execution : null;
}
