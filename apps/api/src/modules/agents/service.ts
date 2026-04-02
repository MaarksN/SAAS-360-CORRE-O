import { randomUUID } from "node:crypto";

import type { ManagedAgentPolicy } from "@birthub/agents-core";
import { prisma } from "@birthub/database";

import { ProblemDetailsError } from "../../lib/problem-details.js";
import { marketplaceService } from "../marketplace/marketplace-service.js";
import {
  mergeManagedPolicies,
  parseAgentConfig
} from "./service.config.js";
import { queueInstalledAgentExecution } from "./service.execution.js";
import {
  buildTemplatePolicies,
  persistManagedPolicies
} from "./service.policy.js";
import {
  resolveInstalledAgent,
  resolveOrganization
} from "./service.repository.js";
import {
  buildSnapshot,
  extractLogs
} from "./service.snapshot.js";
import type { InstalledAgentSnapshot } from "./service.types.js";

export type { InstalledAgentSnapshot } from "./service.types.js";

export class InstalledAgentsService {
  async listInstalledAgents(tenantReference: string): Promise<InstalledAgentSnapshot[]> {
    if (!process.env.DATABASE_URL) {
      return [];
    }

    const organization = await resolveOrganization(tenantReference);
    const agents = await prisma.agent.findMany({
      orderBy: {
        updatedAt: "desc"
      },
      where: {
        tenantId: organization.tenantId
      }
    });

    const snapshots = await Promise.all(
      agents.map(async (agent) => {
        const config = parseAgentConfig(agent.config);

        if (!config.sourceAgentId) {
          return null;
        }

        const catalogEntry = await marketplaceService.getAgentById(config.sourceAgentId);

        if (!catalogEntry) {
          return null;
        }

        const executions = await prisma.agentExecution.findMany({
          orderBy: {
            startedAt: "desc"
          },
          take: 10,
          where: {
            agentId: agent.id,
            tenantId: organization.tenantId
          }
        });

        return buildSnapshot({
          agent,
          executions,
          manifest: catalogEntry.manifest
        });
      })
    );

    return snapshots.filter((snapshot): snapshot is InstalledAgentSnapshot => snapshot !== null);
  }

  async getInstalledAgent(input: {
    installedAgentId: string;
    tenantReference: string;
  }): Promise<InstalledAgentSnapshot> {
    const resolved = await resolveInstalledAgent(input);
    const executions = await prisma.agentExecution.findMany({
      orderBy: {
        startedAt: "desc"
      },
      take: 25,
      where: {
        agentId: resolved.agent.id,
        tenantId: resolved.organization.tenantId
      }
    });

    return buildSnapshot({
      agent: resolved.agent,
      executions,
      manifest: resolved.manifest
    });
  }

  async listInstalledAgentPolicies(input: {
    installedAgentId: string;
    tenantReference: string;
  }): Promise<{
    managedPolicies: ManagedAgentPolicy[];
    manifestPolicies: InstalledAgentSnapshot["manifest"]["policies"];
    runtimeProvider: "manifest-runtime" | "python-orchestrator";
  }> {
    const resolved = await resolveInstalledAgent(input);

    return {
      managedPolicies: resolved.config.managedPolicies,
      manifestPolicies: resolved.manifest.policies,
      runtimeProvider: resolved.config.runtimeProvider
    };
  }

  async upsertInstalledAgentPolicy(input: {
    actions: string[];
    effect: "allow" | "deny";
    enabled?: boolean;
    installedAgentId: string;
    name: string;
    policyId?: string;
    reason?: string;
    tenantReference: string;
    userId: string;
  }): Promise<ManagedAgentPolicy> {
    const resolved = await resolveInstalledAgent({
      installedAgentId: input.installedAgentId,
      tenantReference: input.tenantReference
    });
    const nextPolicy: ManagedAgentPolicy = {
      actions: input.actions,
      effect: input.effect,
      enabled: input.enabled ?? true,
      id: input.policyId ?? `${resolved.agent.id}.policy.${randomUUID()}`,
      name: input.name,
      ...(input.reason ? { reason: input.reason } : {})
    };
    const managedPolicies = mergeManagedPolicies(resolved.config.managedPolicies, nextPolicy);

    await persistManagedPolicies({
      action: "AGENT_POLICY_UPSERTED",
      actorId: input.userId,
      diff: {
        installedAgentId: resolved.agent.id,
        policy: nextPolicy
      },
      entityId: nextPolicy.id,
      entityType: "agent_policy",
      managedPolicies,
      resolved
    });

    return nextPolicy;
  }

  async patchInstalledAgentPolicy(input: {
    actions?: string[];
    effect?: "allow" | "deny";
    enabled?: boolean;
    installedAgentId: string;
    name?: string;
    policyId: string;
    reason?: string;
    tenantReference: string;
    userId: string;
  }): Promise<ManagedAgentPolicy> {
    const resolved = await resolveInstalledAgent({
      installedAgentId: input.installedAgentId,
      tenantReference: input.tenantReference
    });
    const currentPolicy = resolved.config.managedPolicies.find((policy) => policy.id === input.policyId);

    if (!currentPolicy) {
      throw new ProblemDetailsError({
        detail: `Managed policy ${input.policyId} was not found for installed agent ${resolved.agent.id}.`,
        status: 404,
        title: "Policy Not Found"
      });
    }

    const nextPolicy: ManagedAgentPolicy = {
      actions: input.actions ?? currentPolicy.actions,
      effect: input.effect ?? currentPolicy.effect,
      enabled: input.enabled ?? currentPolicy.enabled ?? true,
      id: currentPolicy.id,
      name: input.name ?? currentPolicy.name,
      ...(input.reason ?? currentPolicy.reason
        ? { reason: input.reason ?? currentPolicy.reason }
        : {})
    };
    const managedPolicies = resolved.config.managedPolicies.map((policy) =>
      policy.id === currentPolicy.id ? nextPolicy : policy
    );

    await persistManagedPolicies({
      action: "AGENT_POLICY_UPDATED",
      actorId: input.userId,
      diff: {
        installedAgentId: resolved.agent.id,
        policy: nextPolicy
      },
      entityId: nextPolicy.id,
      entityType: "agent_policy",
      managedPolicies,
      resolved
    });

    return nextPolicy;
  }

  async applyPolicyTemplate(input: {
    installedAgentId: string;
    replaceExisting?: boolean;
    template: "admin" | "readonly" | "standard";
    tenantReference: string;
    userId: string;
  }): Promise<ManagedAgentPolicy[]> {
    const resolved = await resolveInstalledAgent({
      installedAgentId: input.installedAgentId,
      tenantReference: input.tenantReference
    });
    const templatedPolicies = buildTemplatePolicies({
      resolved,
      template: input.template
    });
    const managedPolicies = input.replaceExisting
      ? templatedPolicies
      : Array.from(
          new Map(
            [...resolved.config.managedPolicies, ...templatedPolicies].map((policy) => [policy.id, policy])
          ).values()
        );

    await persistManagedPolicies({
      action: "AGENT_POLICY_TEMPLATE_APPLIED",
      actorId: input.userId,
      diff: {
        installedAgentId: resolved.agent.id,
        managedPolicies,
        replaceExisting: input.replaceExisting ?? false,
        template: input.template
      },
      entityId: resolved.agent.id,
      entityType: "agent_policy_template",
      managedPolicies,
      resolved
    });

    return managedPolicies;
  }

  async getExecutionReplay(input: {
    executionId: string;
    installedAgentId: string;
    tenantReference: string;
  }): Promise<{
    executionId: string;
    logs: string[];
    output: Record<string, unknown> | null;
    status: string;
  }> {
    const resolved = await resolveInstalledAgent({
      installedAgentId: input.installedAgentId,
      tenantReference: input.tenantReference
    });
    const execution = await prisma.agentExecution.findFirst({
      where: {
        agentId: resolved.agent.id,
        id: input.executionId,
        tenantId: resolved.organization.tenantId
      }
    });

    if (!execution) {
      throw new ProblemDetailsError({
        detail: `Execution ${input.executionId} was not found for installed agent ${input.installedAgentId}.`,
        status: 404,
        title: "Execution Not Found"
      });
    }

    return {
      executionId: execution.id,
      logs: extractLogs(execution.metadata),
      output:
        execution.output && typeof execution.output === "object"
          ? (execution.output as Record<string, unknown>)
          : null,
      status: execution.status
    };
  }

  async runInstalledAgent(input: {
    installedAgentId: string;
    payload: Record<string, unknown>;
    tenantReference: string;
    userId: string;
  }): Promise<{
    catalogAgentId: string;
    executionId: string;
    mode: "LIVE";
    reused: boolean;
  }> {
    const resolved = await resolveInstalledAgent({
      installedAgentId: input.installedAgentId,
      tenantReference: input.tenantReference
    });

    return queueInstalledAgentExecution({
      payload: input.payload,
      resolved,
      userId: input.userId
    });
  }
}

export const installedAgentsService = new InstalledAgentsService();
