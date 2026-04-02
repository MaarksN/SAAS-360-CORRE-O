import assert from "node:assert/strict";
import test from "node:test";

import express from "express";
import request from "supertest";

import { requestContextMiddleware } from "../src/middleware/request-context.js";
import { tenantContextMiddleware } from "../src/middleware/tenant-context.js";

void test("contexto de tenant nao e materializado a partir de headers crus", async () => {
  const app = express();

  app.use(requestContextMiddleware);
  app.use(tenantContextMiddleware);
  app.get("/echo", (req, res) => {
    res.status(200).json({
      contextTenantId: req.context.tenantId,
      tenantId: req.tenantContext?.tenantId ?? null
    });
  });

  const [tenantA, tenantB] = await Promise.all([
    request(app).get("/echo").set("x-tenant-id", "tenant-a"),
    request(app).get("/echo").set("x-tenant-id", "tenant-b")
  ]);

  const bodyA = tenantA.body as { contextTenantId: string | null; tenantId: string | null };
  const bodyB = tenantB.body as { contextTenantId: string | null; tenantId: string | null };

  assert.equal(bodyA.tenantId, null);
  assert.equal(bodyA.contextTenantId, null);
  assert.equal(bodyB.tenantId, null);
  assert.equal(bodyB.contextTenantId, null);
});
