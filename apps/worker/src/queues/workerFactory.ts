import { Queue, Worker, type Job, type JobsOptions } from "bullmq";
import { createLogger } from "@birthub/logger";
import type { Redis } from "ioredis";

const logger = createLogger("worker-factory");

export interface DlqJobPayload<TPayload> {
  attemptsMade: number;
  configuredAttempts: number;
  errorMessage: string;
  failedAt: string;
  originalJobId: string | null;
  originalJobName: string;
  originalQueue: string;
  payload: TPayload;
}

export interface ManagedWorker<TPayload> {
  dlqQueue: Queue<DlqJobPayload<TPayload>>;
  queue: Queue<TPayload>;
  worker: Worker<TPayload>;
}

export class WorkerFactory {
  private readonly dlqQueues = new Map<string, Queue<DlqJobPayload<unknown>>>();
  private readonly queues = new Map<string, Queue<unknown>>();
  private readonly workers: Worker[] = [];

  constructor(private readonly connection: Redis) {}

  getDlqQueues(): Queue<DlqJobPayload<unknown>>[] {
    return Array.from(this.dlqQueues.values());
  }

  getQueues(): Queue<unknown>[] {
    return Array.from(this.queues.values());
  }

  getWorkers(): Worker[] {
    return [...this.workers];
  }

  getQueue<TPayload>(name: string, defaultJobOptions?: JobsOptions): Queue<TPayload> {
    const existing = this.queues.get(name);

    if (existing) {
      return existing as Queue<TPayload>;
    }

    const queue = new Queue<TPayload>(name, {
      connection: this.connection as never,
      ...(defaultJobOptions ? { defaultJobOptions } : {})
    });

    this.queues.set(name, queue as Queue<unknown>);
    return queue;
  }

  createWorker<TPayload>(input: {
    concurrency: number;
    defaultJobOptions?: JobsOptions;
    dlqName?: string;
    name: string;
    processor: (job: Job<TPayload>) => Promise<unknown>;
  }): ManagedWorker<TPayload> {
    const queue = this.getQueue<TPayload>(input.name, input.defaultJobOptions);
    const dlqQueue = this.getDlqQueue<TPayload>(input.dlqName ?? `${input.name}.dlq`);
    const worker = new Worker<TPayload>(input.name, input.processor, {
      concurrency: input.concurrency,
      connection: this.connection as never
    });

    worker.on("failed", (job, error) => {
      if (!job) {
        return;
      }

      const configuredAttempts =
        typeof job.opts.attempts === "number" && job.opts.attempts > 0 ? job.opts.attempts : 1;
      if (job.attemptsMade < configuredAttempts) {
        return;
      }

      void dlqQueue
        .add(
          "dead-letter",
          {
            attemptsMade: job.attemptsMade,
            configuredAttempts,
            errorMessage: error instanceof Error ? error.message : "Unknown worker error",
            failedAt: new Date().toISOString(),
            originalJobId: job.id !== undefined ? String(job.id) : null,
            originalJobName: job.name,
            originalQueue: input.name,
            payload: job.data
          },
          {
            jobId: `${input.name}:${String(job.id ?? "unknown")}:${job.attemptsMade}`,
            removeOnComplete: {
              count: 500
            },
            removeOnFail: {
              count: 1_000
            }
          }
        )
        .catch((dlqError) => {
          logger.error(
            {
              dlqName: dlqQueue.name,
              error: dlqError,
              jobId: job.id,
              queue: input.name
            },
            "Failed to forward job to DLQ"
          );
        });
    });

    this.workers.push(worker);

    return {
      dlqQueue,
      queue,
      worker
    };
  }

  async close(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
    await Promise.all(this.getQueues().map((queue) => queue.close()));
    await Promise.all(this.getDlqQueues().map((queue) => queue.close()));
    this.workers.length = 0;
    this.queues.clear();
    this.dlqQueues.clear();
  }

  private getDlqQueue<TPayload>(name: string): Queue<DlqJobPayload<TPayload>> {
    const existing = this.dlqQueues.get(name);

    if (existing) {
      return existing as Queue<DlqJobPayload<TPayload>>;
    }

    const queue = new Queue<DlqJobPayload<TPayload>>(name, {
      connection: this.connection as never,
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: {
          count: 500
        },
        removeOnFail: {
          count: 1_000
        }
      }
    });

    this.dlqQueues.set(name, queue as Queue<DlqJobPayload<unknown>>);
    return queue;
  }
}
