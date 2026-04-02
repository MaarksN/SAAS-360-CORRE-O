// [SOURCE] BirthHub360_Agentes_Parallel_Plan - CompetitorX-Ray
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { ZodError } from "zod";

import { CompetitorXRayAgent } from "../agent.js";
import { CompetitorXRayInputSchema, type CompetitorXRayInput } from "../schemas.js";

void test("CompetitorXRay schema rejects missing required fields", () => {
  const invalidPayload = {
    constraints: {
      currency: "BRL",
      language: "pt-BR",
      maxActions: 4
    },
    requestId: "req-schema-invalid-001",
    sections: ["battlecards"],
    segments: ["enterprise"],
    targetWinRateLiftPct: 22,
    window: {
      endDate: "2026-03-31",
      startDate: "2026-03-01"
    }
  };

  assert.throws(
    () => CompetitorXRayInputSchema.parse(invalidPayload),
    (error) => error instanceof ZodError
  );
});

void test("CompetitorXRay run rejects unknown input fields", async () => {
  const agent = new CompetitorXRayAgent({
    contractPath: path.resolve(
      process.cwd(),
      "audit",
      "pending_review",
      "ciclo1_competitorxray",
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
    sections: ["battlecards", "pricing_benchmarks"],
    segments: ["enterprise", "mid_market"],
    targetWinRateLiftPct: 22,
    tenantId: "tenant_exec_demo",
    unknownField: "not-allowed",
    window: {
      endDate: "2026-03-31",
      startDate: "2026-03-01"
    }
  } as unknown as CompetitorXRayInput;

  await assert.rejects(
    () => agent.run(invalidRuntimePayload),
    (error) => error instanceof ZodError
  );
});
