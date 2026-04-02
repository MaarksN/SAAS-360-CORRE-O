// [SOURCE] BirthHub360_Agentes_Parallel_Plan - ChurnDeflector
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { ChurnDeflectorAgent } from "../agent.js";
import {
  type BrandEvent,
  type ChurnDeflectorInput,
  DEFAULT_BRANDGUARDIAN_CONTRACT
} from "../schemas.js";
import type { ChurnDeflectorToolAdapters } from "../tools.js";

const VALID_INPUT: ChurnDeflectorInput = {
  constraints: {
    currency: "BRL",
    language: "pt-BR",
    maxActions: 4
  },
  requestId: "req-churndeflector-unit-001",
  sections: ["reputation_risk", "narrative_consistency", "pr_response"],
  segments: ["enterprise", "mid_market", "strategic_accounts"],
  targetCultureHealthPct: 74,
  tenantId: "tenant_exec_demo",
  window: {
    endDate: "2026-03-31",
    startDate: "2026-03-01"
  }
};

void test("ChurnDeflector returns success output on happy path", async () => {
  const agent = new ChurnDeflectorAgent({
    contractPath: path.resolve(
      process.cwd(),
      "audit",
      "pending_review",
      "ciclo1_churndeflector",
      "missing_contract.yaml"
    ),
    sleep: async () => undefined
  });

  const output = await agent.run(VALID_INPUT);

  assert.equal(output.status, "success");
  assert.equal(output.fallback.applied, false);
  assert.ok(output.cultureBrief.signals.length >= 2);
  assert.ok(output.observability.metrics.toolCalls >= 3);
  assert.ok(
    output.observability.events.some(
      (event: BrandEvent) => event.name === "churndeflector.response.generated"
    )
  );
});

void test("ChurnDeflector returns error when contract mode is hard_fail", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "churndeflector-contract-"));
  const contractPath = path.join(tempDir, "contract.yaml");
  const contract = {
    ...DEFAULT_BRANDGUARDIAN_CONTRACT,
    failureMode: "hard_fail",
    retry: {
      baseDelayMs: 1,
      maxAttempts: 2
    }
  };
  await writeFile(contractPath, JSON.stringify(contract, null, 2), "utf8");

  const failingAdapters: ChurnDeflectorToolAdapters = {
    async fetchBrandSentiment() {
      throw new Error("brand sentiment unavailable");
    },
    async fetchGuidelineCompliance() {
      throw new Error("guideline compliance unavailable");
    },
    async fetchPRIncidents() {
      throw new Error("pr incidents unavailable");
    }
  };

  try {
    const agent = new ChurnDeflectorAgent({
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
        (event: BrandEvent) => event.name === "churndeflector.fallback.applied"
      )
    );
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
});
