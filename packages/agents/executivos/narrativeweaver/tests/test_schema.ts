// [SOURCE] BirthHub360_Agentes_Parallel_Plan - NarrativeWeaver
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { ZodError } from "zod";

import { NarrativeWeaverAgent } from "../agent.js";
import {
  NarrativeWeaverInputSchema,
  type NarrativeWeaverInput
} from "../schemas.js";

void test("NarrativeWeaver schema rejects missing required fields", () => {
  const invalidPayload = {
    audiences: ["board"],
    constraints: {
      currency: "BRL",
      language: "pt-BR",
      maxActions: 4
    },
    requestId: "req-schema-invalid-001",
    sections: ["board_narrative"],
    targetClarityScorePct: 74,
    window: {
      endDate: "2026-03-31",
      startDate: "2026-03-01"
    }
  };

  assert.throws(
    () => NarrativeWeaverInputSchema.parse(invalidPayload),
    (error) => error instanceof ZodError
  );
});

void test("NarrativeWeaver run rejects unknown input fields", async () => {
  const agent = new NarrativeWeaverAgent({
    contractPath: path.resolve(
      process.cwd(),
      "audit",
      "pending_review",
      "ciclo1_narrativeweaver",
      "missing_contract.yaml"
    ),
    sleep: async () => undefined
  });

  const invalidRuntimePayload = {
    audiences: ["board", "investors"],
    constraints: {
      currency: "BRL",
      language: "pt-BR",
      maxActions: 4
    },
    requestId: "req-runtime-invalid-001",
    sections: ["board_narrative", "risk_disclosure"],
    targetClarityScorePct: 74,
    tenantId: "tenant_exec_demo",
    unknownField: "not-allowed",
    window: {
      endDate: "2026-03-31",
      startDate: "2026-03-01"
    }
  } as unknown as NarrativeWeaverInput;

  await assert.rejects(
    () => agent.run(invalidRuntimePayload),
    (error) => error instanceof ZodError
  );
});
