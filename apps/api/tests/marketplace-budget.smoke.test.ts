import assert from "node:assert/strict";
import test from "node:test";

import { Role, UserStatus, prisma } from "@birthub/database";
import request from "supertest";

import { createApp } from "../src/app.js";
import { budgetService } from "../src/modules/budget/budget.service.js";
import { sha256 } from "../src/modules/auth/crypto.js";
import { createTestApiConfig } from "./test-config.js";

function stubMethod(target: object, key: string, value: unknown): () => void {
  const original: unknown = Reflect.get(target, key) as unknown;
  Reflect.set(target, key, value);
  return () => {
    Reflect.set(target, key, original);
  };
}

const baseConfig = createTestApiConfig();

void test("marketplace search returns facets and ranked agents", async () => {
  const app = createApp({
    config: baseConfig,
    shouldExposeDocs: false
  });

  const response = await request(app)
    .get("/api/v1/agents/search?q=sales&page=1&pageSize=5")
    .expect(200);

  const body = response.body as {
    facets: Record<string, unknown>;
    results: unknown[];
  };

  assert.ok(Array.isArray(body.results));
  assert.ok(typeof body.facets === "object");
  assert.ok(body.results.length >= 1);
  assert.ok(response.headers.etag);

  await request(app)
    .get("/api/v1/agents/search?q=sales&page=1&pageSize=5")
    .set("If-None-Match", response.headers.etag)
    .expect(304);
});

void test("budget endpoints require an authenticated admin session", async () => {
  const restores = [
    stubMethod(prisma.session, "findUnique", (args: { where?: { token?: string } }) => {
      if (args.where?.token !== sha256("atk_admin")) {
        return Promise.resolve(null);
      }

      return Promise.resolve({
        expiresAt: new Date(Date.now() + 60_000),
        id: "session_admin",
        organizationId: "org_1",
        tenantId: "tenant_1",
        revokedAt: null,
        userId: "user_admin"
      });
    }),
    stubMethod(prisma.session, "update", () => Promise.resolve({ id: "session_admin" })),
    stubMethod(prisma.user, "findUnique", () => Promise.resolve({
      id: "user_admin",
      status: UserStatus.ACTIVE
    })),
    stubMethod(prisma.membership, "findUnique", () => Promise.resolve({
      organizationId: "org_1",
      role: Role.ADMIN,
      status: "ACTIVE",
      userId: "user_admin"
    })),
    stubMethod(budgetService, "setLimit", () => Promise.resolve({
      agentId: "sales-pack",
      consumed: 0,
      currency: "BRL",
      id: "budget_1",
      limit: 1,
      tenantId: "tenant_1",
      updatedAt: new Date().toISOString()
    })),
    stubMethod(budgetService, "consumeBudget", () => Promise.resolve({
      agentId: "sales-pack",
      consumed: 0.2,
      currency: "BRL",
      id: "budget_1",
      limit: 1,
      tenantId: "tenant_1",
      updatedAt: new Date().toISOString()
    })),
    stubMethod(budgetService, "getUsage", () => Promise.resolve({
      alerts: [],
      records: [
        {
          agentId: "sales-pack",
          consumed: 0.2,
          currency: "BRL",
          id: "budget_1",
          limit: 1,
          tenantId: "tenant_1",
          updatedAt: new Date().toISOString()
        }
      ],
      usageEvents: []
    }))
  ];

  try {
    const app = createApp({
      config: baseConfig,
      shouldExposeDocs: false
    });

    await request(app)
      .post("/api/v1/budgets/limits")
      .set("x-csrf-token", "csrf_1")
      .set("Cookie", ["bh360_csrf=csrf_1"])
      .send({ agentId: "sales-pack", limit: 1 })
      .expect(401);

    await request(app)
      .post("/api/v1/budgets/limits")
      .set("Authorization", "Bearer atk_admin")
      .set("x-csrf-token", "csrf_1")
      .set("Cookie", ["bh360_csrf=csrf_1"])
      .send({ agentId: "sales-pack", limit: 1 })
      .expect(200);

    await request(app)
      .post("/api/v1/budgets/consume")
      .set("Authorization", "Bearer atk_admin")
      .set("x-csrf-token", "csrf_1")
      .set("Cookie", ["bh360_csrf=csrf_1"])
      .send({ agentId: "sales-pack", costBRL: 0.2, executionMode: "LIVE" })
      .expect(200);

    const usageResponse = await request(app)
      .get("/api/v1/budgets/usage")
      .set("Authorization", "Bearer atk_admin")
      .expect(200);

    const usageBody = usageResponse.body as {
      records: Array<{ tenantId: string }>;
      usageEvents: unknown[];
    };

    assert.ok(Array.isArray(usageBody.records));
    assert.ok(Array.isArray(usageBody.usageEvents));
    assert.equal(usageBody.records[0]?.tenantId, "tenant_1");
  } finally {
    for (const restore of restores.reverse()) {
      restore();
    }
  }
});
