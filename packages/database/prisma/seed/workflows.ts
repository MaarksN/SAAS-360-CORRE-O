import {
  Prisma,
  WorkflowExecutionStatus,
  WorkflowStatus
} from "@prisma/client";

import { createPrismaClient } from "../../src/client.js";
import type { SeedWorkflowDefinition } from "./types.js";

const prisma = createPrismaClient();

export async function disconnectWorkflowClient(): Promise<void> {
  await prisma.$disconnect();
}

export async function createWorkflowWithGraph(input: {
  organizationId: string;
  tenantId: string;
  workflow: SeedWorkflowDefinition;
}): Promise<{ id: string; status: WorkflowStatus }> {
  const workflow = await prisma.workflow.upsert({
    where: {
      tenantId_name: {
        tenantId: input.tenantId,
        name: input.workflow.name
      }
    },
    update: {
      cronExpression: input.workflow.cronExpression ?? null,
      definition: {
        nodes: input.workflow.steps.map((step) => ({
          config: step.config,
          key: step.key,
          name: step.name,
          type: step.type
        })),
        transitions: input.workflow.transitions
      } as Prisma.InputJsonValue,
      description: input.workflow.description,
      status: input.workflow.status,
      triggerType: input.workflow.triggerType
    },
    create: {
      cronExpression: input.workflow.cronExpression ?? null,
      definition: {
        nodes: input.workflow.steps.map((step) => ({
          config: step.config,
          key: step.key,
          name: step.name,
          type: step.type
        })),
        transitions: input.workflow.transitions
      } as Prisma.InputJsonValue,
      description: input.workflow.description,
      eventTopic: input.workflow.eventTopic ?? null,
      name: input.workflow.name,
      organizationId: input.organizationId,
      publishedAt: input.workflow.status === WorkflowStatus.PUBLISHED ? new Date() : null,
      status: input.workflow.status,
      tenantId: input.tenantId,
      triggerConfig: input.workflow.triggerConfig as Prisma.InputJsonValue,
      triggerType: input.workflow.triggerType,
      webhookSecret: input.workflow.webhookSecret ?? null
    }
  });

  const stepIdByKey = new Map<string, string>();
  for (const step of input.workflow.steps) {
    const createdStep = await prisma.workflowStep.upsert({
      where: {
        workflowId_key: { workflowId: workflow.id, key: step.key }
      },
      update: {
        config: step.config as Prisma.InputJsonValue,
        isTrigger: step.isTrigger ?? false,
        name: step.name,
        type: step.type
      },
      create: {
        config: step.config as Prisma.InputJsonValue,
        isTrigger: step.isTrigger ?? false,
        key: step.key,
        name: step.name,
        onError: "STOP",
        organizationId: input.organizationId,
        tenantId: input.tenantId,
        type: step.type,
        workflowId: workflow.id
      }
    });

    stepIdByKey.set(step.key, createdStep.id);
  }

  await Promise.all(
    input.workflow.transitions.map((transition) =>
      prisma.workflowTransition.create({
        data: {
          organizationId: input.organizationId,
          route: transition.route,
          sourceStepId: stepIdByKey.get(transition.sourceKey)!,
          targetStepId: stepIdByKey.get(transition.targetKey)!,
          tenantId: input.tenantId,
          workflowId: workflow.id
        }
      })
    )
  );

  const execCount = await prisma.workflowExecution.count({ where: { workflowId: workflow.id } });
  if (execCount === 0) {
    const seededExecution = await prisma.workflowExecution.create({
      data: {
        organizationId: input.organizationId,
        status: WorkflowExecutionStatus.SUCCESS,
        tenantId: input.tenantId,
        triggerPayload: { seeded: true },
        triggerType: input.workflow.triggerType,
        workflowId: workflow.id
      }
    });

    const triggerStepKey = input.workflow.steps.find((step) => step.isTrigger)?.key;
    const triggerStepId = triggerStepKey ? stepIdByKey.get(triggerStepKey) : null;

    if (triggerStepId) {
      await prisma.stepResult.create({
        data: {
          attempt: 1,
          executionId: seededExecution.id,
          finishedAt: new Date(),
          input: { seeded: true } as Prisma.InputJsonValue,
          organizationId: input.organizationId,
          output: {
            seeded: true,
            tenantId: input.tenantId
          } as Prisma.InputJsonValue,
          outputSize: 64,
          status: "SUCCESS",
          stepId: triggerStepId,
          tenantId: input.tenantId,
          workflowId: workflow.id
        }
      });
    }
  }

  return { id: workflow.id, status: workflow.status };
}
