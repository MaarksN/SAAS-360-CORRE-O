// [SOURCE] BirthHub360_Agentes_Parallel_Plan - TrendCatcher
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { TrendCatcherAgent } from "../agent.js";
import {
  DEFAULT_TRENDCATCHER_CONTRACT,
  type TrendCatcherInput,
  type TrendEvent
} from "../schemas.js";
import type { TrendCatcherToolAdapters } from "../tools.js";

const VALID_INPUT: TrendCatcherInput = {
  constraints: {
    currency: "BRL",
    language: "pt-BR",
    maxActions: 4
  },
  requestId: "req-trendcatcher-unit-001",
  sections: ["emerging_signals", "category_acceleration", "topic_clusters"],
  segments: ["enterprise", "mid_market", "partners"],
  targetGrowthPct: 42,
  tenantId: "tenant_exec_demo",
  window: {
    endDate: "2026-03-31",
    startDate: "2026-03-01"
  }
};

void test("TrendCatcher returns success output on happy path", async () => {
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

  const output = await agent.run(VALID_INPUT);

  assert.equal(output.status, "success");
  assert.equal(output.fallback.applied, false);
  assert.ok(output.trendBrief.signals.length >= 2);
  assert.ok(output.observability.metrics.toolCalls >= 3);
  assert.ok(
    output.observability.events.some(
      (event: TrendEvent) => event.name === "trendcatcher.response.generated"
    )
  );
});

void test("TrendCatcher returns error when contract mode is hard_fail", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "trendcatcher-contract-"));
  const contractPath = path.join(tempDir, "contract.yaml");
  const contract = {
    ...DEFAULT_TRENDCATCHER_CONTRACT,
    failureMode: "hard_fail",
    retry: {
      baseDelayMs: 1,
      maxAttempts: 2
    }
  };
  await writeFile(contractPath, JSON.stringify(contract, null, 2), "utf8");

  const failingAdapters: TrendCatcherToolAdapters = {
    async fetchCategoryGrowth() {
      throw new Error("category growth unavailable");
    },
    async fetchMarketTrends() {
      throw new Error("market trend unavailable");
    },
    async fetchSocialSignals() {
      throw new Error("social signal unavailable");
    }
  };

  try {
    const agent = new TrendCatcherAgent({
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
        (event: TrendEvent) => event.name === "trendcatcher.fallback.applied"
      )
    );
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
});
