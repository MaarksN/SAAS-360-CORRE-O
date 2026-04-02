import assert from "node:assert/strict";
import test from "node:test";

import { ENotasClient } from "./fiscal";
import { getJson, HttpRequestError, postJson } from "./http";
import { PagarmeClient } from "./payments-br";
import { ClickSignClient } from "./signatures";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

void test("postJson retries retryable failures and returns JSON payload", async () => {
  let attempts = 0;

  globalThis.fetch = (async () => {
    attempts += 1;
    if (attempts === 1) {
      return new Response("temporary failure", { status: 503 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as typeof fetch;

  const payload = await postJson<{ ok: boolean }>("https://integrations.test/retry", { ok: true }, {
    retries: 1,
    retryDelayMs: 1,
  });

  assert.equal(payload.ok, true);
  assert.equal(attempts, 2);
});

void test("getJson exposes classified HTTP request errors", async () => {
  globalThis.fetch = (async () => new Response("denied", { status: 403 })) as typeof fetch;

  await assert.rejects(
    () => getJson("https://integrations.test/forbidden", { retries: 0 }),
    (error: unknown) => {
      assert.ok(error instanceof HttpRequestError);
      assert.equal(error.method, "GET");
      assert.equal(error.retryable, false);
      assert.equal(error.status, 403);
      return true;
    },
  );
});

void test("PagarmeClient confirmPayment maps charge data from GET responses", async () => {
  globalThis.fetch = (async (url, init) => {
    assert.equal(String(url), "https://api.pagar.me/core/v5/orders/pay_123");
    assert.equal(init?.method, "GET");
    const headers = init?.headers as Record<string, string> | undefined;
    assert.equal(headers?.Authorization?.startsWith("Basic "), true);

    return new Response(
      JSON.stringify({
        charges: [
          {
            id: "charge_123",
            last_transaction: {
              amount: 14900,
              line: "34191.79001 01043.510047 91020.150008 3 10470000014900",
              qr_code: "qr-payload",
              qr_code_url: "https://payments.test/qr",
              url: "https://payments.test/boleto",
            },
            status: "paid",
          },
        ],
        id: "pay_123",
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  const client = new PagarmeClient("sk_test_123");
  const payment = await client.confirmPayment("pay_123", "tenant-alpha");

  assert.equal(payment.id, "pay_123");
  assert.equal(payment.gatewayId, "charge_123");
  assert.equal(payment.status, "paid");
  assert.equal(payment.amount, 149);
});

void test("ENotasClient getStatus reads the company-scoped invoice resource", async () => {
  globalThis.fetch = (async (url, init) => {
    assert.equal(String(url), "https://api.enotasgw.com.br/v2/empresas/company-001/nfs-e/nfe_123");
    assert.equal(init?.method, "GET");

    return new Response(
      JSON.stringify({
        id: "nfe_123",
        linkPdf: "https://fiscal.test/invoice.pdf",
        linkXml: "https://fiscal.test/invoice.xml",
        numeroNfse: "NF-123",
        status: "authorized",
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  const client = new ENotasClient("api-key", "https://api.enotasgw.com.br/v2", "company-001");
  const invoice = await client.getStatus("nfe_123");

  assert.equal(invoice.id, "nfe_123");
  assert.equal(invoice.status, "authorized");
  assert.equal(invoice.nfeKey, "NF-123");
});

void test("ClickSignClient getStatus maps signer state and downloads", async () => {
  globalThis.fetch = (async (url, init) => {
    assert.equal(String(url), "https://app.clicksign.com/api/v1/documents/doc-1?access_token=token-123");
    assert.equal(init?.method, "GET");

    return new Response(
      JSON.stringify({
        document: {
          downloads: {
            original_file_url: "https://sign.test/original.pdf",
            signed_file_url: "https://sign.test/signed.pdf",
          },
          filename: "msa.pdf",
          key: "doc-1",
          signers: [
            {
              email: "owner@birthub.local",
              signed_at: "2026-03-30T12:00:00.000Z",
            },
          ],
          status: "closed",
        },
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  const client = new ClickSignClient("token-123");
  const document = await client.getStatus("doc-1");

  assert.equal(document.id, "doc-1");
  assert.equal(document.signers[0]?.signed, true);
  assert.equal(document.downloads?.signed_file_url, "https://sign.test/signed.pdf");
});
