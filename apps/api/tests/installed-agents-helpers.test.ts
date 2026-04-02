import assert from "node:assert/strict";
import test from "node:test";

import {
  mergeManagedPolicies,
  parseAgentConfig
} from "../src/modules/agents/service.config.js";
import {
  extractExecutionMode,
  extractLogs
} from "../src/modules/agents/service.snapshot.js";

void test("parseAgentConfig falls back to manifest runtime defaults", () => {
  const parsed = parseAgentConfig(null);

  assert.equal(parsed.runtimeProvider, "manifest-runtime");
  assert.equal(parsed.status, "installed");
  assert.equal(parsed.managedPolicies.length, 0);
});

void test("mergeManagedPolicies replaces repeated ids deterministically", () => {
  const merged = mergeManagedPolicies(
    [
      {
        actions: ["reports.read"],
        effect: "allow",
        id: "policy.shared",
        name: "Old Policy"
      }
    ],
    {
      actions: ["reports.write"],
      effect: "deny",
      id: "policy.shared",
      name: "New Policy"
    }
  );

  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.name, "New Policy");
  assert.deepEqual(merged[0]?.actions, ["reports.write"]);
});

void test("extractExecutionMode inspects output and metadata hints", () => {
  const liveExecution = {
    metadata: {
      runtimeProvider: "manifest-runtime"
    },
    output: null
  } as unknown as Parameters<typeof extractExecutionMode>[0];
  const dryRunExecution = {
    metadata: {
      dryRun: true
    },
    output: null
  } as unknown as Parameters<typeof extractExecutionMode>[0];

  assert.equal(extractExecutionMode(liveExecution), "LIVE");
  assert.equal(extractExecutionMode(dryRunExecution), "DRY_RUN");
});

void test("extractLogs ignores invalid metadata payloads", () => {
  assert.deepEqual(extractLogs(null), []);
  assert.deepEqual(extractLogs({ logs: ["one", 2, "two"] }), ["one", "two"]);
});
