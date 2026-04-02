// [SOURCE] BirthHub360_Agentes_Parallel_Plan - QuotaArchitect
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { QuotaArchitectAgent } from "../agent.js";
import {
  DEFAULT_QUOTAARCHITECT_CONTRACT,
  type QuotaArchitectInput,
  type QuotaEvent
} from "../schemas.js";
import type { QuotaArchitectToolAdapters } from "../tools.js";

const VALID_INPUT: QuotaArchitectInput = {
  constraints: {
    currency: "BRL",
    language: "pt-BR",
    maxActions: 4
  },
  requestId: "req-quotaarchitect-unit-001",
  sections: ["capacity_model", "territory_balance", "coverage_gaps"],
  segments: ["enterprise", "mid_market", "commercial"],
  targetQuotaAttainmentPct: 102,
  tenantId: "tenant_exec_demo",
  window: {
    endDate: "2026-03-31",
    startDate: "2026-03-01"
  }
};

void test("QuotaArchitect returns success output on happy path", async () => {
  const agent = new QuotaArchitectAgent({
    contractPath: path.resolve(
      process.cwd(),
      "audit",
      "pending_review",
      "ciclo1_quotaarchitect",
      "missing_contract.yaml"
    ),
    sleep: async () => undefined
  });

  const output = await agent.run(VALID_INPUT);

  assert.equal(output.status, "success");
  assert.equal(output.fallback.applied, false);
  assert.ok(output.quotaBrief.signals.length >= 2);
  assert.ok(output.observability.metrics.toolCalls >= 3);
  assert.ok(
    output.observability.events.some(
      (event: QuotaEvent) => event.name === "quotaarchitect.response.generated"
    )
  );
});

void test("QuotaArchitect returns error when contract mode is hard_fail", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "quotaarchitect-contract-"));
  const contractPath = path.join(tempDir, "contract.yaml");
  const contract = {
    ...DEFAULT_QUOTAARCHITECT_CONTRACT,
    failureMode: "hard_fail",
    retry: {
      baseDelayMs: 1,
      maxAttempts: 2
    }
  };
  await writeFile(contractPath, JSON.stringify(contract, null, 2), "utf8");

  const failingAdapters: QuotaArchitectToolAdapters = {
    async fetchAttainmentVariance() {
      throw new Error("attainment variance unavailable");
    },
    async fetchCapacityPlanner() {
      throw new Error("capacity planner unavailable");
    },
    async fetchTerritoryCoverage() {
      throw new Error("territory coverage unavailable");
    }
  };

  try {
    const agent = new QuotaArchitectAgent({
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
        (event: QuotaEvent) => event.name === "quotaarchitect.fallback.applied"
      )
    );
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
});
