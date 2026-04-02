import {
  createNotificationForOrganizationRoles,
  createNotificationForUser,
  NotificationType
} from "@birthub/database";
import type { Queue } from "bullmq";

import {
  enqueueEmailNotification,
  type EmailNotificationJobPayload
} from "./notifications/emailQueue.js";
import {
  enqueueWebhookTopicDeliveries,
  type OutboundWebhookJobPayload
} from "./webhooks/outbound.js";

function humanizeAgentId(agentId: string): string {
  return agentId.replace(/[-_]/g, " ").trim().toUpperCase();
}

export async function fanOutExecutionOutcome(input: {
  agentId: string;
  emailQueue: Queue<EmailNotificationJobPayload>;
  errorMessage?: string;
  executionId: string;
  organizationId?: string | null;
  outboundWebhookQueue: Queue<OutboundWebhookJobPayload>;
  status: "FAILED" | "SUCCESS" | "WAITING_APPROVAL";
  tenantId: string;
  userId?: string | null;
  webBaseUrl: string;
}) {
  if (!input.organizationId) {
    return;
  }

  const link = `${input.webBaseUrl}/outputs?executionId=${encodeURIComponent(input.executionId)}`;
  const agentLabel = humanizeAgentId(input.agentId);

  if (input.status === "FAILED") {
    if (input.userId) {
      await createNotificationForUser({
        content: `O Agente ${agentLabel} falhou ao rodar.`,
        link,
        metadata: {
          errorMessage: input.errorMessage ?? null,
          executionId: input.executionId
        },
        organizationId: input.organizationId,
        tenantId: input.tenantId,
        type: NotificationType.AGENT_FAILED,
        userId: input.userId
      });

      await enqueueEmailNotification(input.emailQueue, {
        context: {
          agentId: input.agentId,
          errorMessage: input.errorMessage ?? "Falha nao detalhada.",
          executionId: input.executionId,
          link
        },
        organizationId: input.organizationId,
        tenantId: input.tenantId,
        type: "critical_error",
        userId: input.userId
      });
    } else {
      await createNotificationForOrganizationRoles({
        content: `O Agente ${agentLabel} falhou ao rodar.`,
        link,
        metadata: {
          errorMessage: input.errorMessage ?? null,
          executionId: input.executionId
        },
        organizationId: input.organizationId,
        tenantId: input.tenantId,
        type: NotificationType.AGENT_FAILED
      });
    }
  }

  if (input.status === "WAITING_APPROVAL") {
    if (input.userId) {
      await createNotificationForUser({
        content: `O Agente ${agentLabel} concluiu a execucao e aguarda aprovacao do output.`,
        link,
        metadata: {
          executionId: input.executionId
        },
        organizationId: input.organizationId,
        tenantId: input.tenantId,
        type: NotificationType.INFO,
        userId: input.userId
      });
    } else {
      await createNotificationForOrganizationRoles({
        content: `O Agente ${agentLabel} concluiu a execucao e aguarda aprovacao do output.`,
        link,
        metadata: {
          executionId: input.executionId
        },
        organizationId: input.organizationId,
        tenantId: input.tenantId,
        type: NotificationType.INFO
      });
    }
  }

  if (input.status === "SUCCESS" && input.userId) {
    await enqueueEmailNotification(input.emailQueue, {
      context: {
        agentId: input.agentId,
        executionId: input.executionId,
        link
      },
      organizationId: input.organizationId,
      tenantId: input.tenantId,
      type: "workflow_completed",
      userId: input.userId
    });
  }

  await enqueueWebhookTopicDeliveries(input.outboundWebhookQueue, {
    organizationId: input.organizationId,
    payload: {
      agentId: input.agentId,
      errorMessage: input.errorMessage ?? null,
      executionId: input.executionId,
      status: input.status,
      tenantId: input.tenantId
    },
    tenantId: input.tenantId,
    topic:
      input.status === "SUCCESS"
        ? "agent.finished"
        : input.status === "WAITING_APPROVAL"
          ? "agent.awaiting_approval"
          : "agent.failed"
  });
}
