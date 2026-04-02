import assert from "node:assert/strict";
import test from "node:test";

import { evaluateWorkerReadiness } from "../src/operational/readiness.js";

void test("worker readiness returns degraded when Redis dependency is unavailable", async () => {
  const payload = await evaluateWorkerReadiness({
    listQueueStates: async () => {
      await Promise.resolve();
      return [
        {
          backlog: 7,
          dlq: 1,
          name: "birthub-cycle1"
        }
      ];
    },
    pingRedis: async () => {
      await Promise.resolve();
      throw new Error("ECONNREFUSED redis:6379");
    },
    queueCount: 1,
    workerCount: 1
  });

  assert.equal(payload.status, "degraded");
  assert.equal(payload.dependencies.redis.status, "down");
  assert.match(payload.dependencies.redis.message ?? "", /ECONNREFUSED/);
});
