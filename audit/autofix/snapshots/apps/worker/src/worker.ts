/* eslint-disable */
import { getWorkerConfig } from "@birthub/config";
import { createLogger } from "@birthub/logger";
import { incrementCounter, observeHistogram } from "@birthub/logger";
import { Queue, Worker, type JobsOptions } from "bullmq";
import { Redis } from "ioredis";

import { persistAgentHandoff } from "./agents/handoffs.js";
import { executeManifestAgentRuntime } from "./agents/runtime.js";
import {
  WorkflowRunner,
  type WorkflowExecutionJobPayload,
  type WorkflowTriggerJobPayload,
  workflowQueueNames
} from "./engine/runner.js";
import { executeConnectorRuntimeAction } from "./integrations/connectors.runtime.js";
import { syncOrganizationToHubspot } from "./integrations/hubspot.js";
import { DynamicRateLimiter } from "./lib/rate-limiter.js";
import {
  emailQueueName,
  processEmailNotificationJob,
  type EmailNotificationJobPayload
} from "./notifications/emailQueue.js";
import { getQueueNameForPriority } from "./queues/agentQueue.js";
import { WorkerFactory } from "./queues/workerFactory.js";
import {
  outboundWebhookQueueName,
  processOutboundWebhookJob,
  type OutboundWebhookJobPayload
} from "./webhooks/outbound.js";
import { createBillingLockResolver } from "./worker.billing.js";
import {
  persistExecutionFinished,
  persistExecutionStarted
} from "./worker.execution-state.js";
import type { CrmSyncJobPayload } from "./worker.job-validation.js";
import { createJobProcessor, resolveOrganizationReference } from "./worker.process-job.js";

export { validateLegacyTaskJob } from "./worker.job-validation.js";

const logger = createLogger("worker");
const crmSyncQueueName = "engagement.crm-sync";

export interface WorkerRuntime {
  close: () => Promise<void>;
  connection: Redis;
  dlqQueues: Queue[];
  queues: Queue[];
  workers: Worker[];
}

function recordWorkerJobMetric(input: {
  queue: string;
  status: "completed" | "failed";
  startedAt?: number;
  finishedAt?: number;
}): void {
  incrementCounter(
    "birthub_worker_jobs_total",
    {
      queue: input.queue,
      status: input.status
    },
    1,
    "Total processed worker jobs grouped by queue and status."
  );

  if (
    typeof input.startedAt === "number" &&
    Number.isFinite(input.startedAt) &&
    typeof input.finishedAt === "number" &&
    Number.isFinite(input.finishedAt) &&
    input.finishedAt >= input.startedAt
  ) {
    observeHistogram(
      "birthub_worker_job_duration_ms",
      input.finishedAt - input.startedAt,
      {
        queue: input.queue,
        status: input.status
      },
      {
        help: "Worker job processing duration in milliseconds grouped by queue and status."
      }
    );
  }
}

function buildRetryableJobOptions(input: {
  attempts: number;
  delay: number;
  removeOnCompleteCount: number;
  removeOnFailCount: number;
}): JobsOptions {
  return {
    attempts: input.attempts,
    backoff: {
      delay: input.delay,
      type: "exponential"
    },
    removeOnComplete: {
      count: input.removeOnCompleteCount
    },
    removeOnFail: {
      count: input.removeOnFailCount
    }
  };
}

export function createBirthHubWorker(): WorkerRuntime {
  const config = getWorkerConfig();
  const connection = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null
  });
  const workerFactory = new WorkerFactory(connection);
  const workflowExecutionQueue = workerFactory.getQueue<WorkflowExecutionJobPayload>(
    workflowQueueNames.execution,
    buildRetryableJobOptions({
      attempts: 5,
      delay: 1_000,
      removeOnCompleteCount: 500,
      removeOnFailCount: 500
    })
  );
  const emailQueue = workerFactory.getQueue<EmailNotificationJobPayload>(
    emailQueueName,
    buildRetryableJobOptions({
      attempts: 3,
      delay: 1_000,
      removeOnCompleteCount: 200,
      removeOnFailCount: 200
    })
  );
  const outboundWebhookQueue = workerFactory.getQueue<OutboundWebhookJobPayload>(
    outboundWebhookQueueName,
    buildRetryableJobOptions({
      attempts: 5,
      delay: 1_500,
      removeOnCompleteCount: 300,
      removeOnFailCount: 300
    })
  );
  const workflowTriggerQueue = workerFactory.getQueue<WorkflowTriggerJobPayload>(
    workflowQueueNames.trigger,
    buildRetryableJobOptions({
      attempts: 5,
      delay: 1_000,
      removeOnCompleteCount: 500,
      removeOnFailCount: 500
    })
  );
  const crmSyncQueue = workerFactory.getQueue<CrmSyncJobPayload>(
    crmSyncQueueName,
    buildRetryableJobOptions({
      attempts: 5,
      delay: 2_000,
      removeOnCompleteCount: 200,
      removeOnFailCount: 400
    })
  );
  const dynamicRateLimiter = new DynamicRateLimiter(connection);
  const workflowRunner = new WorkflowRunner(workflowExecutionQueue, {
    httpRequestRateLimiter: dynamicRateLimiter,
    agentExecutor: {
      execute: async ({ agentId, contextSummary, input }) => {
        const tenantId = (input.tenantId as string | undefined) ?? "default-tenant";
        const organization = await resolveOrganizationReference(tenantId);
        const executionId = `workflow-agent:${Date.now()}:${agentId}`;

        await persistExecutionStarted({
          agentId,
          executionId,
          inputPayload: {
            ...input,
            workflowContextSummary: contextSummary
          },
          organizationId: organization?.id ?? null,
          source: "WORKFLOW",
          tenantId,
          userId: null
        });

        try {
          const runtimeResult = await executeManifestAgentRuntime({
            agentId,
            catalogAgentId: agentId,
            contextSummary,
            executionId,
            input: {
              ...input,
              workflowContextSummary: contextSummary
            },
            organizationId: organization?.id ?? null,
            redis: connection,
            source: "WORKFLOW",
            tenantId,
            userId: null
          });

          await persistExecutionFinished({
            executionId,
            metadata: runtimeResult.metadata,
            output: runtimeResult.output,
            outputHash: runtimeResult.outputHash,
            status: runtimeResult.status
          });

          return runtimeResult.output;
        } catch (error) {
          await persistExecutionFinished({
            errorMessage: error instanceof Error ? error.message : "Workflow agent execution failed",
            executionId,
            status: "FAILED"
          });
          throw error;
        }
      }
    },
    connectorExecutor: {
      execute: async ({ action, executionId, tenantId, workflowId }) =>
        executeConnectorRuntimeAction({
          action,
          executionId,
          tenantId,
          workflowId
        })
    },
    handoffExecutor: {
      execute: async (args) =>
        persistAgentHandoff({
          context: args.context,
          contextSummary: args.contextSummary,
          correlationId: args.correlationId,
          executionId: args.executionId,
          sourceAgentId: args.sourceAgentId,
          summary: args.summary,
          targetAgentId: args.targetAgentId,
          tenantId: args.tenantId,
          ...(args.threadId ? { threadId: args.threadId } : {}),
          workflowId: args.workflowId
        })
    },
    notificationDispatcher: {
      send: async (message) => {
        logger.info({ message }, "Workflow notification dispatched");
      }
    }
  });

  const resolveBillingLock = createBillingLockResolver({
    billingGracePeriodDays: config.BILLING_GRACE_PERIOD_DAYS,
    billingStatusCacheTtlSeconds: config.BILLING_STATUS_CACHE_TTL_SECONDS,
    connection
  });
  const processJob = createJobProcessor({
    config,
    connection,
    emailQueue,
    outboundWebhookQueue,
    resolveBillingLock
  });

  const queueNames = [
    config.QUEUE_NAME,
    getQueueNameForPriority("high"),
    getQueueNameForPriority("normal"),
    getQueueNameForPriority("low")
  ];
  const tenantTaskWorkers = queueNames.map((queueName) =>
    workerFactory.createWorker({
      concurrency: config.WORKER_CONCURRENCY,
      defaultJobOptions: buildRetryableJobOptions({
        attempts: 5,
        delay: 1_000,
        removeOnCompleteCount: 500,
        removeOnFailCount: 1_000
      }),
      name: queueName,
      processor: async (job) =>
        processJob({
          data: job.data,
          queueName,
          ...(job.id !== undefined ? { id: job.id } : {})
        })
    })
  );
  const workflowExecutionWorker = workerFactory.createWorker({
    concurrency: config.WORKER_CONCURRENCY,
    defaultJobOptions: buildRetryableJobOptions({
      attempts: 5,
      delay: 1_000,
      removeOnCompleteCount: 500,
      removeOnFailCount: 500
    }),
    name: workflowQueueNames.execution,
    processor: async (job) =>
      workflowRunner.processExecutionJob(job.data as WorkflowExecutionJobPayload)
  });
  const workflowTriggerWorker = workerFactory.createWorker({
    concurrency: config.WORKER_CONCURRENCY,
    defaultJobOptions: buildRetryableJobOptions({
      attempts: 5,
      delay: 1_000,
      removeOnCompleteCount: 500,
      removeOnFailCount: 500
    }),
    name: workflowQueueNames.trigger,
    processor: async (job) =>
      workflowRunner.processTriggerJob(job.data as WorkflowTriggerJobPayload)
  });
  const emailWorker = workerFactory.createWorker({
    concurrency: Math.max(1, Math.floor(config.WORKER_CONCURRENCY / 2)),
    defaultJobOptions: buildRetryableJobOptions({
      attempts: 3,
      delay: 1_000,
      removeOnCompleteCount: 200,
      removeOnFailCount: 200
    }),
    name: emailQueueName,
    processor: async (job) =>
      processEmailNotificationJob(job.data as EmailNotificationJobPayload)
  });
  const outboundWebhookWorker = workerFactory.createWorker({
    concurrency: config.WORKER_CONCURRENCY,
    defaultJobOptions: buildRetryableJobOptions({
      attempts: 5,
      delay: 1_500,
      removeOnCompleteCount: 300,
      removeOnFailCount: 300
    }),
    name: outboundWebhookQueueName,
    processor: async (job) =>
      processOutboundWebhookJob(job.data as OutboundWebhookJobPayload, { redis: connection })
  });
  const crmSyncWorker = workerFactory.createWorker({
    concurrency: Math.max(1, Math.floor(config.WORKER_CONCURRENCY / 2)),
    defaultJobOptions: buildRetryableJobOptions({
      attempts: 5,
      delay: 2_000,
      removeOnCompleteCount: 200,
      removeOnFailCount: 400
    }),
    name: crmSyncQueueName,
    processor: async (job) => {
      const payload = job.data as CrmSyncJobPayload;
      await syncOrganizationToHubspot({
        organizationId: payload.organizationId,
        tenantId: payload.tenantId
      });
    }
  });
  const tenantTaskQueues = tenantTaskWorkers.map((managedWorker) => managedWorker.queue);
  const workers = workerFactory.getWorkers();

  workers.forEach((worker) => {
    worker.on("completed", (job) => {
      const startedAt = typeof job?.processedOn === "number" ? job.processedOn : undefined;
      const finishedAt = typeof job?.finishedOn === "number" ? job.finishedOn : undefined;
      recordWorkerJobMetric({
        queue: worker.name,
        status: "completed",
        ...(startedAt !== undefined ? { startedAt } : {}),
        ...(finishedAt !== undefined ? { finishedAt } : {})
      });
    });

    worker.on("failed", (job, error) => {
      const startedAt = typeof job?.processedOn === "number" ? job.processedOn : undefined;
      const finishedAt = typeof job?.finishedOn === "number" ? job.finishedOn : undefined;
      recordWorkerJobMetric({
        queue: worker.name,
        status: "failed",
        ...(startedAt !== undefined ? { startedAt } : {}),
        ...(finishedAt !== undefined ? { finishedAt } : {})
      });
      logger.error(
        {
          error,
          jobId: job?.id,
          queue: worker.name
        },
        "Worker job failed"
      );
    });
  });

  const close = async (): Promise<void> => {
    await workerFactory.close();
    await connection.quit();
  };

  return {
    close,
    connection,
    dlqQueues: workerFactory.getDlqQueues(),
    queues: [
      ...tenantTaskQueues,
      workflowExecutionWorker.queue,
      workflowTriggerWorker.queue,
      emailWorker.queue,
      outboundWebhookWorker.queue,
      crmSyncWorker.queue
    ],
    workers
  };
}
