import assert from "node:assert/strict";
import test from "node:test";

import { LeadSchema, Plan, QueueName, UserRole } from "./index";

void test("shared types expose stable enums for plans, roles and queues", () => {
  assert.equal(Plan.PRO, "PRO");
  assert.equal(UserRole.ADMIN, "ADMIN");
  assert.equal(QueueName.SDR_QUEUE, "SDR_QUEUE");
});

void test("lead schema parses minimal valid payload", () => {
  const parsed = LeadSchema.parse({
    email: "lead@birthub.local",
    firstName: "Ada",
    lastName: "Lovelace"
  });

  assert.equal(parsed.status, "new");
  assert.equal(parsed.email, "lead@birthub.local");
});