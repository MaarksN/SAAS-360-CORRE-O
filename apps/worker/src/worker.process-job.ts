import { getWorkerConfig } from "@birthub/config";
import {
  ExecutionSource,
  prisma
} from "@birthub/database";
import { createLogger } from "@birthub/logger";
import type { Queue } from "bullmq";
import type { Redis } from "ioredis";

import { executeManifestAgentRuntime } from "./agents/runtime.js";
import { executeTenantJob } from "./tenant-execution.js";
import {
  persistExecutionFinished,
  persistExecutionStarted
} from "./worker.execution-state.js";
import {
  agentExecutionJobSchema,
  hashPayload,
  legacyTaskJobSchema,
  validateLegacyTaskJob
} from "./worker.job-validation.js";
import { fanOutExecutionOutcome } from "./worker.notifications.js";
import type { EmailNotificationJobPayload } from "./notifications/emailQueue.js";
import type { OutboundWebhookJobPayload } from "./webhooks/outbound.js";

const logger = createLogger("worker");

export async function resolveOrganizationReference(tenantReference: string) {
  return prisma.organization.findFirst({
    where: {
      OR: [{ id: tenantReference }, { tenantId: tenantReference }]
    }
  });
}

export function createJobProcessor(input: {
  config: ReturnType<typeof getWorkerConfig>;
  connection: Redis;
  emailQueue: Queue<EmailNotificationJobPayload>;
  outboundWebhookQueue: Queue<OutboundWebhookJobPayload>;
  resolveBillingLock: (
    tenantReference: string
  ) => Promise<{ locked: boolean; status: string | null }>;
}) {
  return async (job: {
    id?: string | number;
    data: unknown;
    queueName: string;
  }) => {
    const jobId = String(job.id ?? "unknown");
    const isLegacyJob = job.queueName === input.config.QUEUE_NAME;
    const executionPayload = await (async () => {
      if (isLegacyJob) {
        const payload = legacyTaskJobSchema.parse(job.data);
        const organization = await resolveOrganizationReference(payload.tenantId ?? "default-tenant");
        const tenantSecret = organization
          ? await prisma.jobSigningSecret.findFirst({
              where: {
                tenantId: organization.tenantId
              }
            })
          : null;
        const tenantId = validateLegacyTaskJob({
          fallbackSecret: input.config.JOB_HMAC_GLOBAL_SECRET,
          jobId,
          payload,
          ...(tenantSecret?.secret ? { tenantSecret: tenantSecret.secret } : {})
        });

        return {
          agentId: payload.type,
          approvalRequired: payload.approvalRequired,
          catalogAgentId: null,
          executionId: `${payload.requestId}:${jobId}`,
          executionMode: payload.executionMode,
          input: payload.payload,
          organizationId: organization?.id ?? null,
          requestId: payload.requestId,
          source: ExecutionSource.MANUAL,
          tenantId,
          userId: payload.userId ?? null
        };
      }

      const payload = agentExecutionJobSchema.parse(job.data);
      const organization = payload.organizationId
        ? await resolveOrganizationReference(payload.organizationId)
        : await resolveOrganizationReference(payload.tenantId);

      return {
        ...payload,
        approvalRequired: false,
        catalogAgentId: payload.catalogAgentId ?? null,
        executionMode: "LIVE" as const,
        organizationId: organization?.id ?? payload.organizationId ?? null,
        requestId: payload.executionId,
        source: ExecutionSource.MANUAL
      };
    })();

    await persistExecutionStarted({
      agentId: executionPayload.agentId,
      executionId: executionPayload.executionId,
      inputPayload: executionPayload.input,
      organizationId: executionPayload.organizationId,
      source: executionPayload.source,
      tenantId: executionPayload.tenantId,
      userId: executionPayload.userId ?? null
    });

    return executeTenantJob(
      {
        requestId: executionPayload.requestId,
        tenantId: executionPayload.tenantId,
        userId: executionPayload.userId ?? executionPayload.agentId
      },
      async () => {
        try {
          const billing = await input.resolveBillingLock(executionPayload.tenantId);
          if (billing.locked) {
            logger.warn(
              {
                executionId: executionPayload.executionId,
                status: billing.status,
                tenantId: executionPayload.tenantId
              },
              "Worker aborted execution due to billing lock"
            );

            await persistExecutionFinished({
              errorMessage: "billing_past_due",
              executionId: executionPayload.executionId,
              status: "FAILED"
            });

            await fanOutExecutionOutcome({
              agentId: executionPayload.agentId,
              emailQueue: input.emailQueue,
              errorMessage: "billing_past_due",
              executionId: executionPayload.executionId,
              organizationId: executionPayload.organizationId,
              outboundWebhookQueue: input.outboundWebhookQueue,
              status: "FAILED",
              tenantId: executionPayload.tenantId,
              userId: executionPayload.userId ?? null,
              webBaseUrl: input.config.WEB_BASE_URL
            });

            return {
              blocked: true,
              blockedAt: new Date().toISOString(),
              reason: "billing_past_due"
            };
          }

          logger.info(
            {
              executionId: executionPayload.executionId,
              jobId: job.id,
              queue: job.queueName
            },
            "Worker started job"
          );

          if (executionPayload.executionMode === "DRY_RUN") {
            const output = {
              logs: ["Simulating LLM call...", "Returning MOCK_DATA"],
              mode: executionPayload.executionMode
            };
            const outputHash = hashPayload(JSON.stringify(output));

            await persistExecutionFinished({
              executionId: executionPayload.executionId,
              metadata: {
                dryRun: true
              },
              output,
              outputHash,
              status: "SUCCESS"
            });

            return {
              completedAt: new Date().toISOString(),
              executionId: executionPayload.executionId,
              outputHash,
              requestId: executionPayload.requestId,
              status: "COMPLETED"
            };
          }

          if (executionPayload.approvalRequired) {
            const output = {
              message: "Awaiting human approval before final output."
            };
            const outputHash = hashPayload(JSON.stringify(output));

            await persistExecutionFinished({
              executionId: executionPayload.executionId,
              output,
              outputHash,
              status: "WAITING_APPROVAL"
            });

            return {
              completedAt: new Date().toISOString(),
              executionId: executionPayload.executionId,
              outputHash,
              requestId: executionPayload.requestId,
              status: "WAITING_APPROVAL"
            };
          }

          const runtimeResult = await executeManifestAgentRuntime({
            agentId: executionPayload.agentId,
            catalogAgentId: executionPayload.catalogAgentId,
            executionId: executionPayload.executionId,
            input: executionPayload.input,
            organizationId: executionPayload.organizationId,
            redis: input.connection,
            source: "MANUAL",
            tenantId: executionPayload.tenantId,
            userId: executionPayload.userId ?? null
          });

          await persistExecutionFinished({
            executionId: executionPayload.executionId,
            metadata: runtimeResult.metadata,
            output: runtimeResult.output,
            outputHash: runtimeResult.outputHash,
            status: runtimeResult.status
          });

          await fanOutExecutionOutcome({
            agentId: executionPayload.agentId,
            emailQueue: input.emailQueue,
            executionId: executionPayload.executionId,
            organizationId: executionPayload.organizationId,
            outboundWebhookQueue: input.outboundWebhookQueue,
            status: runtimeResult.status,
            tenantId: executionPayload.tenantId,
            userId: executionPayload.userId ?? null,
            webBaseUrl: input.config.WEB_BASE_URL
          });

          logger.info(
            {
              executionId: executionPayload.executionId,
              jobId: job.id,
              steps: (runtimeResult.metadata.steps as number | undefined) ?? 0
            },
            "Worker finished job"
          );

          return {
            completedAt: new Date().toISOString(),
            executionId: executionPayload.executionId,
            outputHash: runtimeResult.outputHash,
            requestId: executionPayload.requestId
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown agent execution failure";

          await persistExecutionFinished({
            errorMessage: message,
            executionId: executionPayload.executionId,
            status: "FAILED"
          });

          await fanOutExecutionOutcome({
            agentId: executionPayload.agentId,
            emailQueue: input.emailQueue,
            errorMessage: message,
            executionId: executionPayload.executionId,
            organizationId: executionPayload.organizationId,
            outboundWebhookQueue: input.outboundWebhookQueue,
            status: "FAILED",
            tenantId: executionPayload.tenantId,
            userId: executionPayload.userId ?? null,
            webBaseUrl: input.config.WEB_BASE_URL
          });

          throw error;
        }
      }
    );
  };
}
