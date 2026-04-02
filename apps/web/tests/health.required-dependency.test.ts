import assert from "node:assert/strict";
import test from "node:test";

import { GET } from "../app/health/route";

void test("health returns 503 when required API dependency is unavailable", async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT
  };

  process.env.NEXT_PUBLIC_ENVIRONMENT = "development";
  process.env.NEXT_PUBLIC_API_URL = "http://api.internal.local";

  globalThis.fetch = (() =>
    Promise.resolve(
      new Response(JSON.stringify({ status: "down" }), {
        status: 503
      })
    )) as typeof fetch;

  try {
    const response = await GET();
    const payload = (await response.json()) as {
      status: string;
      dependencies: Array<{ name: string; status: string; mandatory: boolean }>;
    };

    assert.equal(response.status, 503);
    assert.equal(payload.status, "degraded");
    const apiDependency = payload.dependencies.find((dependency) => dependency.name === "api");
    assert.ok(apiDependency);
    assert.equal(apiDependency.mandatory, true);
    assert.equal(apiDependency.status, "down");
  } finally {
    globalThis.fetch = originalFetch;

    if (originalEnv.NEXT_PUBLIC_API_URL === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalEnv.NEXT_PUBLIC_API_URL;
    }

    if (originalEnv.NEXT_PUBLIC_ENVIRONMENT === undefined) {
      delete process.env.NEXT_PUBLIC_ENVIRONMENT;
    } else {
      process.env.NEXT_PUBLIC_ENVIRONMENT = originalEnv.NEXT_PUBLIC_ENVIRONMENT;
    }
  }
});
