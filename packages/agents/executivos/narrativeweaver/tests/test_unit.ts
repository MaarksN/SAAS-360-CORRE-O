// [SOURCE] BirthHub360_Agentes_Parallel_Plan - NarrativeWeaver
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { NarrativeWeaverAgent } from "../agent.js";
import {
  DEFAULT_NARRATIVEWEAVER_CONTRACT,
  type NarrativeEvent,
  type NarrativeWeaverInput
} from "../schemas.js";
import type { NarrativeWeaverToolAdapters } from "../tools.js";

const VALID_INPUT: NarrativeWeaverInput = {
  audiences: ["board", "investors", "leadership_team"],
  constraints: {
    currency: "BRL",
    language: "pt-BR",
    maxActions: 4
  },
  requestId: "req-narrativeweaver-unit-001",
  sections: ["board_narrative", "execution_proof", "risk_disclosure"],
  targetClarityScorePct: 74,
  tenantId: "tenant_exec_demo",
  window: {
    endDate: "2026-03-31",
    startDate: "2026-03-01"
  }
};

void test("NarrativeWeaver returns success output on happy path", async () => {
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

  const output = await agent.run(VALID_INPUT);

  assert.equal(output.status, "success");
  assert.equal(output.fallback.applied, false);
  assert.ok(output.narrativeBrief.signals.length >= 2);
  assert.ok(output.observability.metrics.toolCalls >= 3);
  assert.ok(
    output.observability.events.some(
      (event: NarrativeEvent) => event.name === "narrativeweaver.response.generated"
    )
  );
});

void test("NarrativeWeaver returns error when contract mode is hard_fail", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "narrativeweaver-contract-"));
  const contractPath = path.join(tempDir, "contract.yaml");
  const contract = {
    ...DEFAULT_NARRATIVEWEAVER_CONTRACT,
    failureMode: "hard_fail",
    retry: {
      baseDelayMs: 1,
      maxAttempts: 2
    }
  };
  await writeFile(contractPath, JSON.stringify(contract, null, 2), "utf8");

  const failingAdapters: NarrativeWeaverToolAdapters = {
    async fetchEarningsSignal() {
      throw new Error("earnings signal unavailable");
    },
    async fetchStakeholderSentiment() {
      throw new Error("stakeholder sentiment unavailable");
    },
    async fetchStrategyCoherence() {
      throw new Error("strategy coherence unavailable");
    }
  };

  try {
    const agent = new NarrativeWeaverAgent({
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
        (event: NarrativeEvent) => event.name === "narrativeweaver.fallback.applied"
      )
    );
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
});
