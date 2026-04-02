import assert from "node:assert/strict";
import test from "node:test";

import { MANIFEST_VERSION } from "@birthub/agents-core";

import { buildToolCostTable } from "./runtime.budget.js";
import { matchesPattern, readSessionId } from "./runtime.shared.js";

void test("readSessionId prefers top-level value and falls back to nested context", () => {
  assert.equal(readSessionId({ sessionId: "top-level" }), "top-level");
  assert.equal(readSessionId({ context: { sessionId: "nested" } }), "nested");
  assert.equal(readSessionId({}), null);
});

void test("matchesPattern supports wildcard segments and tool costs include timeouts", () => {
  assert.equal(matchesPattern("tenant:agent:session", "tenant:*:session"), true);

  const costs = buildToolCostTable({
      defaultToolCostBrl: 0.15,
      manifest: {
        agent: {
          changelog: [],
          description: "Agent demo for tests",
          id: "agent.demo",
          kind: "agent",
          name: "Agent Demo",
          prompt: "Execute the demo workflow",
          tenantId: "catalog",
          version: "1.0.0"
        },
        keywords: [],
        manifestVersion: MANIFEST_VERSION,
        policies: [],
        skills: [
          {
            description: "skill",
            id: "skill.demo",
            inputSchema: { type: "object" },
            name: "Skill Demo",
            outputSchema: { type: "object" }
          }
        ],
        tags: {
          domain: [],
          industry: [],
        level: [],
        persona: [],
        "use-case": []
      },
        tools: [
          {
            description: "tool",
            id: "custom-tool",
            inputSchema: { type: "object" },
            name: "Custom Tool",
            outputSchema: { type: "object" },
            timeoutMs: 30_000
          }
        ]
    }
  });

  assert.equal(typeof costs["custom-tool"], "number");
  assert.equal(costs["custom-tool"]! > 0.15, true);
});
