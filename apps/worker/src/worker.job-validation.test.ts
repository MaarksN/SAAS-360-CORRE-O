import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "node:crypto";

import {
  hashPayload,
  validateLegacyTaskJob
} from "./worker.job-validation.js";
import { calculateGraceBoundary } from "./worker.billing.js";

void test("validateLegacyTaskJob accepts signed payloads with matching tenant context", () => {
  const payload = {
    agentId: "agent_1",
    approvalRequired: false,
    context: {
      actorId: "user_1",
      jobId: "job_1",
      organizationId: "org_1",
      scopedAt: "2026-03-22T00:00:00.000Z",
      tenantId: "tenant_1"
    },
    estimatedCostBRL: 0.42,
    executionMode: "LIVE" as const,
    payload: {
      segment: "enterprise"
    },
    requestId: "req_1",
    signature: "",
    tenantId: "tenant_1",
    type: "sync-session" as const,
    userId: "user_1",
    version: "1" as const
  };
  const signatureBase = JSON.stringify({
    agentId: payload.agentId,
    approvalRequired: payload.approvalRequired,
    context: payload.context,
    estimatedCostBRL: payload.estimatedCostBRL,
    executionMode: payload.executionMode,
    payload: payload.payload,
    requestId: payload.requestId,
    tenantId: payload.tenantId,
    type: payload.type,
    userId: payload.userId,
    version: payload.version
  });
  payload.signature = createHmac("sha256", "secret").update(signatureBase).digest("hex");

  assert.equal(
    validateLegacyTaskJob({
      fallbackSecret: "secret",
      jobId: "job_1",
      payload
    }),
    "tenant_1"
  );
});

void test("hashPayload is deterministic and calculateGraceBoundary adds days", () => {
  assert.equal(hashPayload("same"), hashPayload("same"));
  assert.equal(
    calculateGraceBoundary(new Date("2026-03-20T00:00:00.000Z"), 3).toISOString(),
    "2026-03-23T00:00:00.000Z"
  );
});
