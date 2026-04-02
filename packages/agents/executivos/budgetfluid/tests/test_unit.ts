// [SOURCE] BirthHub360_Agentes_Parallel_Plan - BudgetFluid
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { BudgetFluidAgent } from "../agent.js";
import {
  type BudgetEvent,
  type BudgetFluidInput,
  DEFAULT_BUDGETFLUID_CONTRACT
} from "../schemas.js";
import type { BudgetFluidToolAdapters } from "../tools.js";

const VALID_INPUT: BudgetFluidInput = {
  constraints: {
    currency: "BRL",
    language: "pt-BR",
    maxActions: 4
  },
  requestId: "req-budgetfluid-unit-001",
  sections: ["allocation_rebalance", "forecast_drift", "variance_hotspots"],
  segments: ["enterprise", "mid_market", "demand_gen"],
  targetBudgetEfficiencyPct: 67,
  tenantId: "tenant_exec_demo",
  window: {
    endDate: "2026-03-31",
    startDate: "2026-03-01"
  }
};

void test("BudgetFluid returns success output on happy path", async () => {
  const agent = new BudgetFluidAgent({
    contractPath: path.resolve(
      process.cwd(),
      "audit",
      "pending_review",
      "ciclo1_budgetfluid",
      "missing_contract.yaml"
    ),
    sleep: async () => undefined
  });

  const output = await agent.run(VALID_INPUT);

  assert.equal(output.status, "success");
  assert.equal(output.fallback.applied, false);
  assert.ok(output.budgetBrief.signals.length >= 2);
  assert.ok(output.observability.metrics.toolCalls >= 3);
  assert.ok(
    output.observability.events.some(
      (event: BudgetEvent) => event.name === "budgetfluid.response.generated"
    )
  );
});

void test("BudgetFluid returns error when contract mode is hard_fail", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "budgetfluid-contract-"));
  const contractPath = path.join(tempDir, "contract.yaml");
  const contract = {
    ...DEFAULT_BUDGETFLUID_CONTRACT,
    failureMode: "hard_fail",
    retry: {
      baseDelayMs: 1,
      maxAttempts: 2
    }
  };
  await writeFile(contractPath, JSON.stringify(contract, null, 2), "utf8");

  const failingAdapters: BudgetFluidToolAdapters = {
    async fetchForecastDrift() {
      throw new Error("forecast drift unavailable");
    },
    async fetchScenarioStress() {
      throw new Error("scenario stress unavailable");
    },
    async fetchSpendTelemetry() {
      throw new Error("spend telemetry unavailable");
    }
  };

  try {
    const agent = new BudgetFluidAgent({
      contractPath,
      sleep: async () => undefined,
      toolAdapters: failingAdapters
    });
    const output = await agent.run(VALID_INPUT);

    assert.equal(output.status, "error");
    assert.equal(output.fallback.applied, true);
    assert.equal(output.fallback.mode, "hard_fail");
    assert.ok(output.fallback.reasons.length >= 3);
    assert.ok(output.observability.metrics.retries >= 3);
    assert.ok(
      output.observability.events.some(
        (event: BudgetEvent) => event.name === "budgetfluid.fallback.applied"
      )
    );
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
});
