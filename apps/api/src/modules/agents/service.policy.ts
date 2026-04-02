import { createPolicyTemplate, type ManagedAgentPolicy } from "@birthub/agents-core";
import { prisma } from "@birthub/database";

import { toPrismaJsonValue } from "../../lib/prisma-json.js";
import { normalizeConfigObject } from "./service.config.js";
import type { ResolvedInstalledAgent } from "./service.types.js";

export function buildTemplatePolicies(input: {
  resolved: ResolvedInstalledAgent;
  template: "admin" | "readonly" | "standard";
}): ManagedAgentPolicy[] {
  return createPolicyTemplate(
    input.template,
    input.resolved.organization.tenantId,
    input.resolved.agent.id
  ).map((policy, index) => ({
    actions: [policy.action],
    effect: policy.effect,
    enabled: true,
    id: policy.id,
    name: `${input.template} template ${index + 1}`,
    ...(policy.reason ? { reason: policy.reason } : {})
  }));
}

export async function persistManagedPolicies(input: {
  action: string;
  actorId: string;
  diff: Record<string, unknown>;
  entityId: string;
  entityType: string;
  managedPolicies: ManagedAgentPolicy[];
  resolved: ResolvedInstalledAgent;
}): Promise<void> {
  const config = normalizeConfigObject(input.resolved.agent.config);

  await prisma.$transaction(async (tx) => {
    await tx.agent.update({
      data: {
        config: toPrismaJsonValue({
          ...config,
          managedPolicies: input.managedPolicies
        })
      },
      where: {
        id: input.resolved.agent.id
      }
    });

    await tx.auditLog.create({
      data: {
        action: input.action,
        actorId: input.actorId,
        diff: toPrismaJsonValue(input.diff),
        entityId: input.entityId,
        entityType: input.entityType,
        tenantId: input.resolved.organization.tenantId
      }
    });
  });
}
