import assert from "node:assert/strict";
import test from "node:test";

import { validateExternalUrl } from "../src/lib/external-url.js";

void test("validateExternalUrl rejects loopback and private network targets", () => {
  const cases = [
    "http://127.0.0.1:8080/hook",
    "https://10.0.0.8/webhook",
    "https://192.168.0.10/webhook",
    "https://169.254.169.254/latest/meta-data",
    "https://metadata.google.internal/computeMetadata/v1"
  ];

  for (const rawUrl of cases) {
    const result = validateExternalUrl(rawUrl, { requireHttps: true });
    assert.equal(result.ok, false, rawUrl);
  }
});

void test("validateExternalUrl allows public HTTPS endpoints", () => {
  const result = validateExternalUrl("https://hooks.example.com/birthhub", {
    requireHttps: true
  });

  assert.equal(result.ok, true);
  assert.equal(result.url?.hostname, "hooks.example.com");
});

void test("validateExternalUrl allows localhost only for local development flows", () => {
  const allowed = validateExternalUrl("http://localhost:8787/webhook", {
    allowLocalDevelopmentUrls: true,
    requireHttps: true
  });
  const blocked = validateExternalUrl("http://localhost:8787/webhook", {
    allowLocalDevelopmentUrls: false,
    requireHttps: true
  });

  assert.equal(allowed.ok, true);
  assert.equal(blocked.ok, false);
});
