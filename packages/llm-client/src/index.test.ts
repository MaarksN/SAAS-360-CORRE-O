import assert from "node:assert/strict";
import test from "node:test";

import { LLMClient } from "../index";

void test("llm client fails fast when no providers are configured", async () => {
  const client = new LLMClient({ providers: {} });

  await assert.rejects(
    () => client.chat([{ content: "hello", role: "user" }]),
    (error) => error instanceof Error && error.message === "All LLM providers failed or not configured."
  );
});