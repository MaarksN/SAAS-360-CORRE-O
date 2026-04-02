import assert from "node:assert/strict";
import test from "node:test";

import { CRMAdapterFactory, GoogleCalendarClient, HubspotClient, PagarmeClient, WebhookRegistry } from "../index";

void test("integrations entrypoint exposes critical clients and adapters", () => {
  assert.equal(typeof HubspotClient, "function");
  assert.equal(typeof PagarmeClient, "function");
  assert.equal(typeof GoogleCalendarClient, "function");
  assert.equal(typeof CRMAdapterFactory, "function");
  assert.equal(typeof WebhookRegistry, "function");
});

void test("webhook registry signs and verifies payloads", () => {
  const registry = new WebhookRegistry();
  const endpoint = registry.register("tenant_1", {
    eventTypes: ["billing.updated"],
    secret: "test-secret-placeholder",
    url: "https://birthhub.test/hooks"
  });
  const payload = JSON.stringify({ ok: true });
  const signature = registry.createSignature(endpoint, payload);

  assert.equal(registry.verifySignature(endpoint, payload, signature), true);
  assert.equal(registry.verifySignature(endpoint, payload, "invalid"), false);
});
