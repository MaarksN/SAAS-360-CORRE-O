import { randomUUID } from "node:crypto";

import { getApiConfig } from "@birthub/config";
import { prisma } from "@birthub/database";

import { toPrismaJsonValue } from "../../lib/prisma-json.js";
import {
  QueueBackpressureError,
  TenantQueueRateLimitError
} from "../../lib/queue.js";
import { ProblemDetailsError } from "../../lib/problem-details.js";
import { enqueueInstalledAgentExecution } from "./queue.js";
import { findReusableRunningExecution } from "./service.repository.js";
import { buildPayloadHash } from "./service.snapshot.js";
import type {
  InstalledAgentRunResult,
  ResolvedInstalledAgent
} from "./service.types.js";

export async function queueInstalledAgentExecution(input: {
  payload: Record<string, unknown>;
  resolved: ResolvedInstalledAgent;
  userId: string;
}): Promise<InstalledAgentRunResult> {
  const payloadHash = buildPayloadHash(input.payload);
  const reusableExecution = await findReusableRunningExecution({
    agentId: input.resolved.agent.id,
    payloadHash,
    tenantId: input.resolved.organization.tenantId
  });

  if (reusableExecution) {
    await prisma.auditLog.create({
      data: {
        action: "AGENT_LIVE_EXECUTION_REUSED",
        actorId: input.userId,
        diff: toPrismaJsonValue({
          executionId: reusableExecution.id,
          installedAgentId: input.resolved.agent.id,
          payloadHash
        }),
        entityId: reusableExecution.id,
        entityType: "agent_execution",
        tenantId: input.resolved.organization.tenantId
      }
    });

    return {
      catalogAgentId: input.resolved.manifest.agent.id,
      executionId: reusableExecution.id,
      mode: "LIVE",
      reused: true
    };
  }

  const executionId = randomUUID();
  const startedAt = new Date();
  const initialLogs = [
    `Resolved installed agent ${input.resolved.agent.id} from catalog ${input.resolved.manifest.agent.id}.`,
    `Queued live execution for runtime provider ${input.resolved.config.runtimeProvider}.`
  ];

  await prisma.$transaction(async (tx) => {
    await tx.agentExecution.upsert({
      create: {
        agentId: input.resolved.agent.id,
        id: executionId,
        input: toPrismaJsonValue(input.payload),
        metadata: toPrismaJsonValue({
          catalogAgentId: input.resolved.manifest.agent.id,
          logs: initialLogs,
          payloadHash,
          runtimeProvider: input.resolved.config.runtimeProvider
        }),
        organizationId: input.resolved.organization.id,
        source: "MANUAL",
        startedAt,
        status: "RUNNING",
        tenantId: input.resolved.organization.tenantId,
        userId: input.userId
      },
      update: {
        agentId: input.resolved.agent.id,
        input: toPrismaJsonValue(input.payload),
        metadata: toPrismaJsonValue({
          catalogAgentId: input.resolved.manifest.agent.id,
          logs: initialLogs,
          payloadHash,
          runtimeProvider: input.resolved.config.runtimeProvider
        }),
        organizationId: input.resolved.organization.id,
        source: "MANUAL",
        startedAt,
        status: "RUNNING",
        tenantId: input.resolved.organization.tenantId,
        userId: input.userId
      },
      where: {
        id: executionId
      }
    });

    await tx.auditLog.create({
      data: {
        action: "AGENT_LIVE_EXECUTION_QUEUED",
        actorId: input.userId,
        diff: toPrismaJsonValue({
          catalogAgentId: input.resolved.manifest.agent.id,
          executionId,
          installedAgentId: input.resolved.agent.id,
          mode: "LIVE",
          payloadHash,
          runtimeProvider: input.resolved.config.runtimeProvider
        }),
        entityId: executionId,
        entityType: "agent_execution",
        tenantId: input.resolved.organization.tenantId
      }
    });
  });

  try {
    const queued = await enqueueInstalledAgentExecution(getApiConfig(), {
      agentId: input.resolved.agent.id,
      catalogAgentId: input.resolved.manifest.agent.id,
      executionId,
      input: input.payload,
      organizationId: input.resolved.organization.id,
      tenantId: input.resolved.organization.tenantId,
      userId: input.userId
    });

    await prisma.agentExecution.update({
      data: {
        metadata: toPrismaJsonValue({
          catalogAgentId: input.resolved.manifest.agent.id,
          logs: [
            ...initialLogs,
            `Job ${queued.jobId} aceito pela fila com backlog pendente ${queued.pendingJobs}.`
          ],
          payloadHash,
          queueJobId: queued.jobId,
          queuePendingJobs: queued.pendingJobs,
          runtimeProvider: input.resolved.config.runtimeProvider
        })
      },
      where: {
        id: executionId
      }
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to enqueue installed-agent execution.";

    await prisma.$transaction(async (tx) => {
      await tx.agentExecution.update({
        data: {
          completedAt: new Date(),
          errorMessage,
          metadata: toPrismaJsonValue({
            catalogAgentId: input.resolved.manifest.agent.id,
            logs: [...initialLogs, `Falha ao enfileirar execucao live: ${errorMessage}`],
            payloadHash,
            runtimeProvider: input.resolved.config.runtimeProvider
          }),
          status: "FAILED"
        },
        where: {
          id: executionId
        }
      });

      await tx.auditLog.create({
        data: {
          action: "AGENT_LIVE_EXECUTION_QUEUE_FAILED",
          actorId: input.userId,
          diff: toPrismaJsonValue({
            errorMessage,
            executionId,
            installedAgentId: input.resolved.agent.id,
            payloadHash
          }),
          entityId: executionId,
          entityType: "agent_execution",
          tenantId: input.resolved.organization.tenantId
        }
      });
    });

    if (error instanceof QueueBackpressureError) {
      throw new ProblemDetailsError({
        detail: error.message,
        status: 503,
        title: "Queue Backpressure"
      });
    }

    if (error instanceof TenantQueueRateLimitError) {
      throw new ProblemDetailsError({
        detail: error.message,
        status: 429,
        title: "Rate Limit Exceeded"
      });
    }

    throw new ProblemDetailsError({
      detail: errorMessage,
      status: 503,
      title: "Queue Unavailable"
    });
  }

  return {
    catalogAgentId: input.resolved.manifest.agent.id,
    executionId,
    mode: "LIVE",
    reused: false
  };
}
