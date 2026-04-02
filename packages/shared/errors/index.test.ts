import assert from "node:assert/strict";
import test from "node:test";

import { DomainError } from "./index.ts";

void test("domain error preserves metadata and serializes cleanly", () => {
  const error = new DomainError({
    category: "AUTH",
    code: "AUTH_EXPIRED",
    details: { sessionId: "sess_1" },
    message: "Session expired"
  });

  assert.equal(error.name, "DomainError");
  assert.deepEqual(error.toJSON(), {
    category: "AUTH",
    code: "AUTH_EXPIRED",
    details: { sessionId: "sess_1" },
    message: "Session expired"
  });
});