// [SOURCE] BirthHub360_Agentes_Parallel_Plan - TrendCatcher
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { ZodError } from "zod";

import { TrendCatcherAgent } from "../agent.js";
import { TrendCatcherInputSchema, type TrendCatcherInput } from "../schemas.js";

void test("TrendCatcher schema rejects missing required fields", () => {
  const invalidPayload = {
    constraints: {
      currency: "BRL",
      language: "pt-BR",
      maxActions: 4
    },
    requestId: "req-schema-invalid-001",
    sections: ["emerging_signals"],
    segments: ["enterprise"],
    targetGrowthPct: 42,
    window: {
      endDate: "2026-03-31",
      startDate: "2026-03-01"
    }
  };

  assert.throws(
    () => TrendCatcherInputSchema.parse(invalidPayload),
    (error) => error instanceof ZodError
  );
});

void test("TrendCatcher run rejects unknown input fields", async () => {
  const agent = new TrendCatcherAgent({
    contractPath: path.resolve(
      process.cwd(),
      "audit",
      "pending_review",
      "ciclo1_trendcatcher",
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
    sections: ["emerging_signals", "topic_clusters"],
    segments: ["enterprise", "mid_market"],
    targetGrowthPct: 42,
    tenantId: "tenant_exec_demo",
    unknownField: "not-allowed",
    window: {
      endDate: "2026-03-31",
      startDate: "2026-03-01"
    }
  } as unknown as TrendCatcherInput;

  await assert.rejects(
    () => agent.run(invalidRuntimePayload),
    (error) => error instanceof ZodError
  );
});
