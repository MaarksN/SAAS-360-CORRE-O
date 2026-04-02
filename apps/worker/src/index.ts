import { createServer } from "node:http";

import { getWorkerConfig } from "@birthub/config";
import { createLogger } from "@birthub/logger";
import { incrementCounter, renderPrometheusMetrics, setGauge } from "@birthub/logger";

import {
  evaluateFailRateAlerts,
  LoggingFailRateNotifier,
  NoopFailRateMetricsSource
} from "./alerts/failRateAlert.js";
import { startCycle2Jobs } from "./jobs/scheduler.js";
import { cleanupSuspendedUsers } from "./jobs/userCleanup.js";
import { createBirthHubWorker } from "./worker.js";
import { initializeWorkerOpenTelemetry, shutdownWorkerOpenTelemetry } from "./observability/otel.js";
import { evaluateWorkerReadiness, type WorkerQueueState } from "./operational/readiness.js";

initializeWorkerOpenTelemetry();

const config = getWorkerConfig();
const logger = createLogger("worker-bootstrap");
const runtime = createBirthHubWorker();
const cleanupIntervalMs = 24 * 60 * 60 * 1000;
const failRateIntervalMs = 5 * 60 * 1000;
const queueMetricsIntervalMs = 15 * 1000;
const failRateMetricsSource = new NoopFailRateMetricsSource();
const failRateNotifier = new LoggingFailRateNotifier();
const cycle2Jobs = startCycle2Jobs();

async function listQueueStates(): Promise<WorkerQueueState[]> {
  const states = await Promise.all(
    runtime.queues.map(async (queue) => {
      const dlqQueue = runtime.dlqQueues.find(
        (candidateQueue) => candidateQueue.name === `${queue.name}.dlq`
      );
      const [counts, dlqCounts] = await Promise.all([
        queue.getJobCounts(
          "active",
          "delayed",
          "paused",
          "prioritized",
          "waiting",
          "failed"
        ),
        dlqQueue
          ? dlqQueue.getJobCounts("active", "delayed", "paused", "prioritized", "waiting")
          : Promise.resolve(null)
      ]);
      const backlog =
        (counts.active ?? 0) +
        (counts.waiting ?? 0) +
        (counts.prioritized ?? 0) +
        (counts.delayed ?? 0) +
        (counts.paused ?? 0);
      const dlq =
        (dlqCounts?.active ?? 0) +
        (dlqCounts?.waiting ?? 0) +
        (dlqCounts?.prioritized ?? 0) +
        (dlqCounts?.delayed ?? 0) +
        (dlqCounts?.paused ?? 0);

      return {
        backlog,
        dlq,
        name: queue.name
      };
    })
  );

  return states;
}

async function collectQueueOperationalMetrics(): Promise<void> {
  const queueStates = await listQueueStates();

  let totalBacklog = 0;
  let totalDlq = 0;
  for (const queueState of queueStates) {
    totalBacklog += queueState.backlog;
    totalDlq += queueState.dlq;

    setGauge(
      "birthub_worker_queue_backlog_jobs",
      queueState.backlog,
      { queue: queueState.name },
      "Current worker queue backlog grouped by queue."
    );
    setGauge(
      "birthub_worker_queue_dlq_jobs",
      queueState.dlq,
      { queue: queueState.name },
      "Current worker failed jobs (DLQ) grouped by queue."
    );
  }

  setGauge(
    "birthub_worker_queue_backlog_total",
    totalBacklog,
    {},
    "Current total backlog across all worker queues."
  );
  setGauge(
    "birthub_worker_queue_dlq_total",
    totalDlq,
    {},
    "Current total failed jobs (DLQ) across all worker queues."
  );
}

const healthServer = createServer((request, response) => {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");

  if (requestUrl.pathname === "/health") {
    const payload = {
      checkedAt: new Date().toISOString(),
      queueName: config.QUEUE_NAME,
      status: "ok",
      workerConcurrency: config.WORKER_CONCURRENCY
    };

    incrementCounter(
      "birthub_worker_healthcheck_requests_total",
      {
        endpoint: "health",
        status: payload.status
      },
      1,
      "Total worker healthcheck requests grouped by endpoint and status."
    );
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": "application/json"
    });
    response.end(JSON.stringify(payload));
    return;
  }

  if (requestUrl.pathname === "/readiness") {
    void evaluateWorkerReadiness({
      listQueueStates,
      pingRedis: () => runtime.connection.ping(),
      queueCount: runtime.queues.length,
      workerCount: runtime.workers.length
    })
      .then((payload) => {
        const statusCode = payload.status === "ok" ? 200 : 503;
        incrementCounter(
          "birthub_worker_healthcheck_requests_total",
          {
            endpoint: "readiness",
            status: payload.status
          },
          1,
          "Total worker healthcheck requests grouped by endpoint and status."
        );
        response.writeHead(statusCode, {
          "cache-control": "no-store",
          "content-type": "application/json"
        });
        response.end(JSON.stringify(payload));
      })
      .catch((error) => {
        logger.error({ error }, "Worker readiness probe failed");
        response.writeHead(503, {
          "cache-control": "no-store",
          "content-type": "application/json"
        });
        response.end(
          JSON.stringify({
            checkedAt: new Date().toISOString(),
            message: "Readiness evaluation failed",
            service: "worker",
            status: "degraded"
          })
        );
      });
    return;
  }

  if (requestUrl.pathname === "/metrics") {
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": "text/plain; version=0.0.4"
    });
    response.end(renderPrometheusMetrics());
    return;
  }

  response.writeHead(404).end();
  return;
});
const cleanupTimer = setInterval(() => {
  void cleanupSuspendedUsers()
    .then((result) => {
      logger.info(result, "Suspended users cleanup executed");
    })
    .catch((error) => {
      logger.error({ error }, "Suspended users cleanup failed");
    });
}, cleanupIntervalMs);
const failRateTimer = setInterval(() => {
  void evaluateFailRateAlerts({
    notifier: failRateNotifier,
    source: failRateMetricsSource,
    threshold: 0.2,
    windowMinutes: 5
  }).catch((error) => {
    logger.error({ error }, "Fail-rate alert evaluation failed");
  });
}, failRateIntervalMs);
const queueMetricsTimer = setInterval(() => {
  void collectQueueOperationalMetrics().catch((error) => {
    logger.error({ error }, "Queue metrics collection failed");
  });
}, queueMetricsIntervalMs);

void cleanupSuspendedUsers()
  .then((result) => {
    logger.info(result, "Initial suspended users cleanup executed");
  })
  .catch((error) => {
    logger.error({ error }, "Initial suspended users cleanup failed");
  });

void collectQueueOperationalMetrics().catch((error) => {
  logger.error({ error }, "Initial queue metrics collection failed");
});

logger.info(
  {
    concurrency: config.WORKER_CONCURRENCY,
    healthPort: config.WORKER_HEALTH_PORT,
    queueName: config.QUEUE_NAME,
    queues: runtime.workers.map((worker) => worker.name)
  },
  "BirthHub360 worker online"
);

healthServer.listen(config.WORKER_HEALTH_PORT, () => {
  logger.info({ healthPort: config.WORKER_HEALTH_PORT }, "Worker health server online");
});

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info({ signal }, "Shutting down worker");
  clearInterval(cleanupTimer);
  clearInterval(failRateTimer);
  clearInterval(queueMetricsTimer);
  await new Promise<void>((resolve, reject) => {
    healthServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
  await cycle2Jobs.stop();
  await runtime.close();
  await shutdownWorkerOpenTelemetry();
  logger.info({ signal }, "Worker shutdown completed");
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});
