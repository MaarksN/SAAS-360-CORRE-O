import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createApp } from "../src/app.js";
import { createTestApiConfig } from "./test-config.js";

void test("health endpoint returns 200 with database, redis and external status", async () => {
  const config = createTestApiConfig();

  const app = createApp({
    config,
    healthService: () => Promise.resolve({
      checkedAt: new Date("2026-03-13T00:00:00.000Z").toISOString(),
      services: {
        database: {
          status: "up" as const
        },
        externalDependencies: [
          {
            name: "example.com",
            status: "up" as const
          }
        ],
        redis: {
          status: "up" as const
        }
      },
      status: "ok" as const
    }),
    shouldExposeDocs: false
  });

  const response = await request(app).get("/api/v1/health").expect(200);

  const body = response.body as {
    services: {
      database: { status: string };
      externalDependencies: Array<{ status: string }>;
      redis: { status: string };
    };
    status: string;
  };

  assert.equal(body.status, "ok");
  assert.equal(body.services.database.status, "up");
  assert.equal(body.services.redis.status, "up");
  assert.equal(body.services.externalDependencies[0]?.status, "up");
});

void test("health alias returns 200 for container probes", async () => {
  const config = createTestApiConfig();

  const app = createApp({
    config,
    healthService: () => Promise.resolve({
      checkedAt: new Date("2026-03-13T00:00:00.000Z").toISOString(),
      services: {
        database: {
          status: "up" as const
        },
        externalDependencies: [],
        redis: {
          status: "up" as const
        }
      },
      status: "ok" as const
    }),
    shouldExposeDocs: false
  });

  const response = await request(app).get("/health").expect(200);
  const body = response.body as { status: string };
  assert.equal(body.status, "ok");
});

void test("readiness endpoint returns 503 when deep dependencies are degraded", async () => {
  const config = createTestApiConfig();

  const app = createApp({
    config,
    readinessService: () =>
      Promise.resolve({
        checkedAt: new Date("2026-03-13T00:00:00.000Z").toISOString(),
        mode: "readiness" as const,
        services: {
          database: {
            latencyMs: 901,
            message: "latency 901ms exceeded 750ms",
            status: "down" as const,
            strict: true,
            thresholdMs: 750
          },
          externalDependencies: [],
          redis: {
            latencyMs: 40,
            status: "up" as const,
            strict: true,
            thresholdMs: 750
          }
        },
        status: "degraded" as const
      }),
    shouldExposeDocs: false
  });

  const response = await request(app).get("/api/v1/health/readiness").expect(503);
  const body = response.body as {
    mode: string;
    services: { database: { latencyMs: number; status: string } };
    status: string;
  };

  assert.equal(body.mode, "readiness");
  assert.equal(body.status, "degraded");
  assert.equal(body.services.database.status, "down");
  assert.equal(body.services.database.latencyMs, 901);
});
