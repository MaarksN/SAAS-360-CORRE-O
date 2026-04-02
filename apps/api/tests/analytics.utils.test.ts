import assert from "node:assert/strict";
import test from "node:test";

import { resolveDateRange, uniqueTenantCount } from "../src/modules/analytics/analytics.utils.js";

void test("resolveDateRange preserves explicit range boundaries", () => {
  const from = new Date("2026-03-01T00:00:00.000Z");
  const to = new Date("2026-03-15T00:00:00.000Z");
  const range = resolveDateRange({ from, to });

  assert.equal(range.from.toISOString(), from.toISOString());
  assert.equal(range.to.toISOString(), to.toISOString());
});

void test("uniqueTenantCount deduplicates tenant identifiers", () => {
  assert.equal(uniqueTenantCount(["tenant_a", "tenant_b", "tenant_a", "tenant_c"]), 3);
});
