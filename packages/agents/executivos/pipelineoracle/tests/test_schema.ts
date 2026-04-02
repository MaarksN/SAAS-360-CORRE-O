// [SOURCE] BirthHub360_Agentes_Parallel_Plan - PipelineOracle
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { ZodError } from "zod";

import { PipelineOracleAgent } from "../agent.js";
import {
  PipelineOracleInputSchema,
  type PipelineOracleInput
} from "../schemas.js";

void test("PipelineOracle schema rejects missing required fields", () => {
  const invalidPayload = {
    constraints: {
      currency: "BRL",
      language: "pt-BR",
      maxActions: 4
    },
    requestId: "req-schema-invalid-001",
    sections: ["capacity_model"],
    segments: ["enterprise"],
    targetQuotaAttainmentPct: 102,
    window: {
      endDate: "2026-03-31",
      startDate: "2026-03-01"
    }
  };

  assert.throws(
    () => PipelineOracleInputSchema.parse(invalidPayload),
    (error) => error instanceof ZodError
  );
});

void test("PipelineOracle run rejects unknown input fields", async () => {
  const agent = new PipelineOracleAgent({
    contractPath: path.resolve(
      process.cwd(),
      "audit",
      "pending_review",
      "ciclo1_pipelineoracle",
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
    sections: ["capacity_model", "territory_balance"],
    segments: ["enterprise", "mid_market"],
    targetQuotaAttainmentPct: 102,
    tenantId: "tenant_exec_demo",
    unknownField: "not-allowed",
    window: {
      endDate: "2026-03-31",
      startDate: "2026-03-01"
    }
  } as unknown as PipelineOracleInput;

  await assert.rejects(
    () => agent.run(invalidRuntimePayload),
    (error) => error instanceof ZodError
  );
});
