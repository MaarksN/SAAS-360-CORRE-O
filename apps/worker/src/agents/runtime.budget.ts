import type { AgentManifest } from "@birthub/agents-core";
import { prisma } from "@birthub/database";

import {
  createRuntimeError,
  DEFAULT_AGENT_BUDGET_LIMIT_BRL,
  roundCurrency,
  toJsonValue
} from "./runtime.shared.js";

export function buildToolCostTable(input: {
  defaultToolCostBrl: number;
  manifest: AgentManifest;
}): Record<string, number> {
  const table: Record<string, number> = {
    "db-read": 0.08,
    "db-write": 0.12,
    http: 0.22,
    "send-email": 0.06
  };

  for (const tool of input.manifest.tools) {
    const timeoutWeight = Math.min(tool.timeoutMs / 60_000, 1) * 0.08;
    table[tool.id] = roundCurrency(input.defaultToolCostBrl + timeoutWeight);
  }

  return table;
}

export async function ensureBudgetHeadroom(input: {
  actorId: string;
  agentId: string;
  estimatedCostBrl: number;
  executionId: string;
  organizationId: string;
  tenantId: string;
}): Promise<{
  consumedBrl: number;
  limitBrl: number;
}> {
  const budget = await prisma.agentBudget.upsert({
    create: {
      agentId: input.agentId,
      limitBrl: DEFAULT_AGENT_BUDGET_LIMIT_BRL,
      organizationId: input.organizationId,
      tenantId: input.tenantId
    },
    update: {},
    where: {
      tenantId_agentId: {
        agentId: input.agentId,
        tenantId: input.tenantId
      }
    }
  });

  const projectedConsumption = roundCurrency(budget.consumedBrl + input.estimatedCostBrl);
  if (projectedConsumption <= budget.limitBrl) {
    return {
      consumedBrl: budget.consumedBrl,
      limitBrl: budget.limitBrl
    };
  }

  await prisma.agentBudget.update({
    data: {
      lastAlertLevel: "BLOCK_100"
    },
    where: {
      id: budget.id
    }
  });

  await prisma.agentBudgetEvent.create({
    data: {
      actorId: input.actorId,
      agentId: input.agentId,
      costBrl: input.estimatedCostBrl,
      executionMode: "LIVE",
      kind: "BLOCK_100",
      metadata: toJsonValue({
        consumedBrl: projectedConsumption,
        executionId: input.executionId,
        limitBrl: budget.limitBrl,
        message: `Execution ${input.executionId} blocked before start because the tenant budget would be exceeded.`
      }),
      organizationId: input.organizationId,
      requestId: input.executionId,
      tenantId: input.tenantId
    }
  });

  throw createRuntimeError(
    "AGENT_BUDGET_EXCEEDED",
    `Execution would exceed the configured budget for agent ${input.agentId}.`
  );
}

export async function consumeBudget(input: {
  actorId: string;
  agentId: string;
  costBrl: number;
  executionId: string;
  organizationId: string;
  tenantId: string;
}): Promise<{
  consumedBrl: number;
  limitBrl: number;
  lastAlertLevel: string | null;
}> {
  return prisma.$transaction(async (tx) => {
    const budget = await tx.agentBudget.upsert({
      create: {
        agentId: input.agentId,
        limitBrl: DEFAULT_AGENT_BUDGET_LIMIT_BRL,
        organizationId: input.organizationId,
        tenantId: input.tenantId
      },
      update: {},
      where: {
        tenantId_agentId: {
          agentId: input.agentId,
          tenantId: input.tenantId
        }
      }
    });

    const nextConsumedBrl = roundCurrency(budget.consumedBrl + input.costBrl);
    const nextAlertLevel =
      nextConsumedBrl >= budget.limitBrl
        ? "BLOCK_100"
        : nextConsumedBrl >= budget.limitBrl * 0.8
          ? "WARN_80"
          : budget.lastAlertLevel;

    const updatedBudget = await tx.agentBudget.update({
      data: {
        consumedBrl: nextConsumedBrl,
        lastAlertLevel: nextAlertLevel
      },
      where: {
        id: budget.id
      }
    });

    await tx.agentBudgetEvent.create({
      data: {
        actorId: input.actorId,
        agentId: input.agentId,
        costBrl: input.costBrl,
        executionMode: "LIVE",
        kind: "CONSUME",
        metadata: toJsonValue({
          consumedBrl: nextConsumedBrl,
          executionId: input.executionId,
          limitBrl: updatedBudget.limitBrl
        }),
        organizationId: input.organizationId,
        requestId: input.executionId,
        tenantId: input.tenantId
      }
    });

    if (nextAlertLevel === "WARN_80" || nextAlertLevel === "BLOCK_100") {
      await tx.agentBudgetEvent.create({
        data: {
          actorId: input.actorId,
          agentId: input.agentId,
          executionMode: "LIVE",
          kind: nextAlertLevel,
          metadata: toJsonValue({
            consumedBrl: nextConsumedBrl,
            executionId: input.executionId,
            limitBrl: updatedBudget.limitBrl,
            message:
              nextAlertLevel === "WARN_80"
                ? `Agent ${input.agentId} crossed the 80% budget threshold.`
                : `Agent ${input.agentId} reached the configured budget cap.`
          }),
          organizationId: input.organizationId,
          requestId: input.executionId,
          tenantId: input.tenantId
        }
      });
    }

    return {
      consumedBrl: updatedBudget.consumedBrl,
      lastAlertLevel: updatedBudget.lastAlertLevel ?? null,
      limitBrl: updatedBudget.limitBrl
    };
  });
}
