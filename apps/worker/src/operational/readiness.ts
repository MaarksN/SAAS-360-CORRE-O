export interface WorkerQueueState {
  name: string;
  backlog: number;
  dlq: number;
}

export interface WorkerReadinessResponse {
  checkedAt: string;
  service: "worker";
  status: "ok" | "degraded";
  dependencies: {
    redis: {
      status: "up" | "down";
      message?: string;
    };
    runtime: {
      status: "up" | "down";
      workerCount: number;
      queueCount: number;
      backlog: number;
      dlq: number;
    };
  };
  queues: WorkerQueueState[];
}

export async function evaluateWorkerReadiness(input: {
  pingRedis: () => Promise<string>;
  listQueueStates: () => Promise<WorkerQueueState[]>;
  workerCount: number;
  queueCount: number;
}): Promise<WorkerReadinessResponse> {
  const [redisStatus, queueStates] = await Promise.all([
    input
      .pingRedis()
      .then((response) => {
        const status: "up" | "down" = response.toUpperCase() === "PONG" ? "up" : "down";
        return {
          message: response,
          status
        };
      })
      .catch((error) => ({
        message: error instanceof Error ? error.message : "Redis ping failed",
        status: "down" as const
      })),
    input.listQueueStates().catch(() => [])
  ]);

  const backlog = queueStates.reduce((total, queue) => total + queue.backlog, 0);
  const dlq = queueStates.reduce((total, queue) => total + queue.dlq, 0);
  const runtimeReady = input.workerCount > 0 && input.queueCount > 0;

  const status = redisStatus.status === "up" && runtimeReady ? "ok" : "degraded";

  return {
    checkedAt: new Date().toISOString(),
    dependencies: {
      redis: redisStatus,
      runtime: {
        backlog,
        dlq,
        queueCount: input.queueCount,
        status: runtimeReady ? "up" : "down",
        workerCount: input.workerCount
      }
    },
    queues: queueStates,
    service: "worker",
    status
  };
}
