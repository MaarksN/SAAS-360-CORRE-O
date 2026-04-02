// [SOURCE] BirthHub360_Agentes_Parallel_Plan - CrisisNavigator
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { CrisisNavigatorAgent } from "../agent.js";
import {
  type CompetitorEvent,
  type CrisisNavigatorInput,
  DEFAULT_COMPETITORXRAY_CONTRACT
} from "../schemas.js";
import type { CrisisNavigatorToolAdapters } from "../tools.js";

const VALID_INPUT: CrisisNavigatorInput = {
  constraints: {
    currency: "BRL",
    language: "pt-BR",
    maxActions: 4
  },
  requestId: "req-crisisnavigator-unit-001",
  sections: ["battlecards", "pricing_benchmarks", "feature_gaps"],
  segments: ["enterprise", "mid_market", "strategic_accounts"],
  targetRecoveryPct: 22,
  tenantId: "tenant_exec_demo",
  window: {
    endDate: "2026-03-31",
    startDate: "2026-03-01"
  }
};

void test("CrisisNavigator returns success output on happy path", async () => {
  const agent = new CrisisNavigatorAgent({
    contractPath: path.resolve(
      process.cwd(),
      "audit",
      "pending_review",
      "ciclo1_crisisnavigator",
      "missing_contract.yaml"
    ),
    sleep: async () => undefined
  });

  const output = await agent.run(VALID_INPUT);

  assert.equal(output.status, "success");
  assert.equal(output.fallback.applied, false);
  assert.ok(output.crisisBrief.signals.length >= 2);
  assert.ok(output.observability.metrics.toolCalls >= 3);
  assert.ok(
    output.observability.events.some(
      (event: CompetitorEvent) => event.name === "crisisnavigator.response.generated"
    )
  );
});

void test("CrisisNavigator returns error when contract mode is hard_fail", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "crisisnavigator-contract-"));
  const contractPath = path.join(tempDir, "contract.yaml");
  const contract = {
    ...DEFAULT_COMPETITORXRAY_CONTRACT,
    failureMode: "hard_fail",
    retry: {
      baseDelayMs: 1,
      maxAttempts: 2
    }
  };
  await writeFile(contractPath, JSON.stringify(contract, null, 2), "utf8");

  const failingAdapters: CrisisNavigatorToolAdapters = {
    async fetchCompetitorIntel() {
      throw new Error("competitor intel unavailable");
    },
    async fetchFeatureGap() {
      throw new Error("feature gap unavailable");
    },
    async fetchPricingBenchmark() {
      throw new Error("pricing benchmark unavailable");
    }
  };

  try {
    const agent = new CrisisNavigatorAgent({
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
        (event: CompetitorEvent) => event.name === "crisisnavigator.fallback.applied"
      )
    );
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
});
