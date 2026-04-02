// [SOURCE] BirthHub360_Agentes_Parallel_Plan - BrandGuardian
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { ZodError } from "zod";

import { BrandGuardianAgent } from "../agent.js";
import { BrandGuardianInputSchema, type BrandGuardianInput } from "../schemas.js";

void test("BrandGuardian schema rejects missing required fields", () => {
  const invalidPayload = {
    constraints: {
      currency: "BRL",
      language: "pt-BR",
      maxActions: 4
    },
    requestId: "req-schema-invalid-001",
    sections: ["reputation_risk"],
    segments: ["enterprise"],
    targetBrandSentimentPct: 74,
    window: {
      endDate: "2026-03-31",
      startDate: "2026-03-01"
    }
  };

  assert.throws(
    () => BrandGuardianInputSchema.parse(invalidPayload),
    (error) => error instanceof ZodError
  );
});

void test("BrandGuardian run rejects unknown input fields", async () => {
  const agent = new BrandGuardianAgent({
    contractPath: path.resolve(
      process.cwd(),
      "audit",
      "pending_review",
      "ciclo1_brandguardian",
      "missing_contract.yaml"
    ),
    sleep: async () => undefined
  });

  const invalidRuntimePayload = {
    constraints: {
      currency: "BRL",
      language: "pt-BR",
      maxActions: 4
    },
    requestId: "req-runtime-invalid-001",
    sections: ["reputation_risk", "pr_response"],
    segments: ["enterprise", "mid_market"],
    targetBrandSentimentPct: 74,
    tenantId: "tenant_exec_demo",
    unknownField: "not-allowed",
    window: {
      endDate: "2026-03-31",
      startDate: "2026-03-01"
    }
  } as unknown as BrandGuardianInput;

  await assert.rejects(
    () => agent.run(invalidRuntimePayload),
    (error) => error instanceof ZodError
  );
});
