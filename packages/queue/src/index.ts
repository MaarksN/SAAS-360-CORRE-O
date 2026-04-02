import { performance } from "node:perf_hooks";

import {
  Queue,
  QueueEvents,
  Worker,
  type Job,
  type JobsOptions,
  type Processor,
  type QueueEventsOptions,
  type QueueOptions,
  type WorkerOptions
} from "bullmq";
import IORedis from "ioredis";

import { createLogger, incrementCounter, observeHistogram, setGauge } from "@birthub/logger";
import { QueueName } from "@birthub/shared-types";

import { QUEUE_CONFIG } from "./definitions";

const DEFAULT_REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const DEFAULT_REMOVE_ON_COMPLETE = { count: 100 };
const DEFAULT_REMOVE_ON_FAIL = { count: 500 };
const logger = createLogger("queue-manager");

type QueueIdentifier = QueueName | string;
type ManagedQueue = Queue<unknown, unknown, string>;
type ManagedWorker = Worker<unknown, unknown, string>;
type ManagedQueueEvents = QueueEvents;

export interface QueueManagerOptions {
  redisUrl?: string;
}

function resolveQueueName(name: QueueIdentifier): string {
  return typeof name === "string" ? name : String(name);
}

function resolveDefaultJobOptions(name: QueueIdentifier): JobsOptions {
  const queueName = resolveQueueName(name);
  const config = QUEUE_CONFIG[queueName];

  const options: JobsOptions = {
    attempts: config?.attempts ?? 1,
    removeOnComplete: config?.removeOnComplete ?? DEFAULT_REMOVE_ON_COMPLETE,
    removeOnFail: config?.removeOnFail ?? DEFAULT_REMOVE_ON_FAIL
  };

  if (config?.backoff !== undefined) {
    options.backoff = config.backoff;
  }

  if (config?.priority !== undefined) {
    options.priority = config.priority;
  }

  return options;
}

function createRedisConnection(redisUrl: string): IORedis {
  const connection = new IORedis(redisUrl, {
    enableReadyCheck: true,
    lazyConnect: false,
    maxRetriesPerRequest: null
  });

  connection.on("error", (error) => {
    logger.error(
      {
        err: error,
        redisUrl
      },
      "Shared queue Redis connection error"
    );
  });

  return connection;
}

export class QueueManager {
  private readonly connection: IORedis;
  private readonly queueEvents = new Set<ManagedQueueEvents>();
  private readonly queues = new Map<string, ManagedQueue>();
  private readonly workers = new Set<ManagedWorker>();

  constructor(options: QueueManagerOptions | string = {}) {
    const redisUrl =
      typeof options === "string" ? options : (options.redisUrl ?? DEFAULT_REDIS_URL);

    this.connection = createRedisConnection(redisUrl);
  }

  private async recordQueueDepth(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return;
    }

    const counts = await queue.getJobCounts("active", "delayed", "prioritized", "waiting");
    const depth =
      (counts.active ?? 0) +
      (counts.delayed ?? 0) +
      (counts.prioritized ?? 0) +
      (counts.waiting ?? 0);

    setGauge(
      "birthub_queue_depth",
      depth,
      { queue: queueName },
      "Current queue depth grouped by queue name."
    );
  }

  private registerWorkerTelemetry(worker: ManagedWorker, queueName: string): void {
    worker.on("completed", (job) => {
      incrementCounter(
        "birthub_queue_jobs_processed_total",
        {
          queue: queueName,
          status: "completed"
        },
        1,
        "Total queue jobs processed grouped by queue and status."
      );
      void this.recordQueueDepth(queueName);
      logger.info(
        {
          jobId: String(job.id),
          queue: queueName
        },
        "Queue job completed"
      );
    });

    worker.on("failed", (job, error) => {
      incrementCounter(
        "birthub_queue_jobs_processed_total",
        {
          queue: queueName,
          status: "failed"
        },
        1,
        "Total queue jobs processed grouped by queue and status."
      );
      void this.recordQueueDepth(queueName);
      logger.error(
        {
          err: error,
          jobId: job ? String(job.id) : null,
          queue: queueName
        },
        "Queue job failed"
      );
    });

    worker.on("error", (error) => {
      logger.error(
        {
          err: error,
          queue: queueName
        },
        "Queue worker emitted an error"
      );
    });
  }

  createQueue<DataType = unknown, ResultType = unknown, NameType extends string = string>(
    name: NameType
  ): Queue<DataType, ResultType, NameType> {
    const queueName = resolveQueueName(name);

    if (this.queues.has(queueName)) {
      return this.queues.get(queueName) as Queue<DataType, ResultType, NameType>;
    }

    const queueOptions: QueueOptions = {
      connection: this.connection as unknown as QueueOptions["connection"]
    };
    const queue = new Queue<DataType, ResultType, NameType>(queueName, queueOptions);

    this.queues.set(queueName, queue as ManagedQueue);
    void this.recordQueueDepth(queueName);
    logger.info({ queue: queueName }, "Queue created");

    return queue;
  }

  createWorker<DataType = unknown, ResultType = unknown, NameType extends string = string>(
    name: NameType,
    processor: Processor<DataType, ResultType, NameType>,
    options: Omit<WorkerOptions, "connection"> = {}
  ): Worker<DataType, ResultType, NameType> {
    const queueName = resolveQueueName(name);
    void this.createQueue<DataType, ResultType, NameType>(name);

    const worker = new Worker<DataType, ResultType, NameType>(
      queueName,
      async (job: Job<DataType, ResultType, NameType>) => {
        const startedAt = performance.now();

        try {
          return await processor(job);
        } finally {
          observeHistogram(
            "birthub_queue_job_duration_ms",
            performance.now() - startedAt,
            {
              job_name: job.name,
              queue: queueName
            },
            {
              help: "Queue job duration in milliseconds grouped by queue and job name."
            }
          );
        }
      },
      {
        connection: this.connection as unknown as WorkerOptions["connection"],
        ...options
      }
    );

    this.workers.add(worker as unknown as ManagedWorker);
    this.registerWorkerTelemetry(worker as unknown as ManagedWorker, queueName);
    logger.info({ queue: queueName }, "Worker created");

    return worker;
  }

  createQueueEvents<NameType extends string = string>(
    name: NameType,
    options: Omit<QueueEventsOptions, "connection"> = {}
  ): QueueEvents {
    const queueName = resolveQueueName(name);
    const queueEvents = new QueueEvents(queueName, {
      connection: this.connection as unknown as QueueEventsOptions["connection"],
      ...options
    });

    this.queueEvents.add(queueEvents);
    return queueEvents;
  }

  async addJob(
    queueName: QueueIdentifier,
    jobName: string,
    data: unknown,
    opts?: JobsOptions
  ): Promise<Job<unknown, unknown, string>> {
    const resolvedQueueName = resolveQueueName(queueName);
    const queue = this.createQueue(resolvedQueueName);
    const startedAt = performance.now();
    const jobOptions = opts ? { ...resolveDefaultJobOptions(resolvedQueueName), ...opts } : resolveDefaultJobOptions(resolvedQueueName);
    const job = await queue.add(jobName, data, jobOptions);

    incrementCounter(
      "birthub_queue_jobs_enqueued_total",
      {
        job_name: jobName,
        queue: resolvedQueueName
      },
      1,
      "Total queue jobs enqueued grouped by queue and job name."
    );
    observeHistogram(
      "birthub_queue_enqueue_duration_ms",
      performance.now() - startedAt,
      {
        job_name: jobName,
        queue: resolvedQueueName
      },
      {
        help: "Queue enqueue duration in milliseconds grouped by queue and job name."
      }
    );
    void this.recordQueueDepth(resolvedQueueName);

    logger.info(
      {
        jobId: String(job.id),
        jobName,
        queue: resolvedQueueName
      },
      "Queue job enqueued"
    );

    return job;
  }

  async scheduleRecurringJobs(): Promise<void> {
    for (const [name, cfg] of Object.entries(QUEUE_CONFIG)) {
      if (!cfg.cron) {
        continue;
      }

      const repeatJobId = `${name.toLowerCase()}-cron`;
      const queue = this.createQueue(name);
      await queue.add(
        `${name.toLowerCase()}-scheduled`,
        { queue: name, scheduled: true },
        {
          ...resolveDefaultJobOptions(name),
          jobId: repeatJobId,
          repeat: { pattern: cfg.cron }
        }
      );
      void this.recordQueueDepth(name);
    }
  }

  async close(): Promise<void> {
    await Promise.all(Array.from(this.workers.values()).map((worker) => worker.close()));
    this.workers.clear();
    await Promise.all(Array.from(this.queueEvents.values()).map((queueEvents) => queueEvents.close()));
    this.queueEvents.clear();
    await Promise.all(Array.from(this.queues.values()).map((queue) => queue.close()));
    this.queues.clear();

    if (this.connection.status !== "end") {
      await this.connection.quit();
    }
  }
}

let manager: QueueManager | null = null;

function getManager(): QueueManager {
  if (!manager) {
    manager = new QueueManager();
  }

  return manager;
}

export function scopedQueueName(baseQueue: QueueName | string, tenantId?: string, plan?: string): string {
  if (!tenantId) {
    return String(baseQueue);
  }

  const tenantSafe = String(tenantId).replace(/[^a-zA-Z0-9_-]/g, "-");
  const planSafe = plan ? String(plan).replace(/[^a-zA-Z0-9_-]/g, "-") : "default";
  return `${baseQueue}__tenant_${tenantSafe}__plan_${planSafe}`;
}

export const createQueue = <DataType = unknown, ResultType = unknown, NameType extends string = string>(
  name: NameType
): Queue<DataType, ResultType, NameType> => getManager().createQueue<DataType, ResultType, NameType>(name);

export const createWorker = <DataType = unknown, ResultType = unknown, NameType extends string = string>(
  name: NameType,
  processor: Processor<DataType, ResultType, NameType>,
  options?: Omit<WorkerOptions, "connection">
): Worker<DataType, ResultType, NameType> =>
  getManager().createWorker<DataType, ResultType, NameType>(name, processor, options);

export const createQueueEvents = <NameType extends string = string>(
  name: NameType,
  options?: Omit<QueueEventsOptions, "connection">
): QueueEvents => getManager().createQueueEvents(name, options);

export const closeRedis = async (): Promise<void> => {
  if (!manager) {
    return;
  }

  await manager.close();
  manager = null;
};

export const QUEUES = {
  BANK_RECONCILIATION: QueueName.BANK_RECONCILIATION,
  BOARD_REPORT: QueueName.BOARD_REPORT,
  CHURN_RISK_HIGH: QueueName.CHURN_RISK_HIGH,
  COMMISSION_CALC: QueueName.COMMISSION_CALC,
  CONTRACT_ANALYSIS: QueueName.CONTRACT_ANALYSIS,
  CONTRACT_DEADLINES: QueueName.CONTRACT_DEADLINES,
  DEAL_CLOSED_WON: QueueName.DEAL_CLOSED_WON,
  DOMAIN_WARMUP: QueueName.DOMAIN_WARMUP,
  EMAIL_CADENCE_SEND: QueueName.EMAIL_CADENCE_SEND,
  HEALTH_ALERT: QueueName.HEALTH_ALERT,
  HEALTH_SCORE_UPDATE: QueueName.HEALTH_SCORE_UPDATE,
  INVOICE_GENERATE: QueueName.INVOICE_GENERATE,
  LEAD_ENRICHMENT: QueueName.LEAD_ENRICHMENT,
  NPS_ANALYSIS: QueueName.NPS_ANALYSIS
};

export * from "./workers";
export * from "./job-context";

export * from "./definitions.js";
