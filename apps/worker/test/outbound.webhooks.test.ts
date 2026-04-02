// [SOURCE] CI-TS-004
import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { prisma, WebhookEndpointStatus } from "@birthub/database";

test.afterEach(() => {
  mock.restoreAll();
});

// In Node.js test runner, prisma object methods might be properties that need different mocking.
// Using mock.method on prisma.model can fail if the model itself isn't a plain object with methods.
// We'll wrap the prisma models in a way that mock.method works, or just mock the object directly
// if the test runner throws "The argument 'methodName' must be a method."
import {
  enqueueWebhookTopicDeliveries,
  processOutboundWebhookJob,
  type OutboundWebhookJobPayload
} from "../src/webhooks/outbound.js";
import type { Queue } from "bullmq";

type MockCall = { arguments: unknown[] };
function readMockCalls(spy: unknown): MockCall[] {
  if (typeof spy !== "function" && (typeof spy !== "object" || spy === null)) {
    throw new Error("Mock function does not expose calls");
  }

  const maybeMock = (spy as { mock?: { calls?: unknown } }).mock;
  if (maybeMock && Array.isArray(maybeMock.calls)) {
    return maybeMock.calls as MockCall[];
  }

  throw new Error("Mock function does not expose calls");
}

void test("outbound webhooks", async (t) => {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/test";
  process.env.REDIS_URL = "redis://localhost:6379";

  await t.test("enqueueWebhookTopicDeliveries - enqueues jobs for active endpoints matching topic", async () => {
    const mockEndpoints = [
      { id: "ep1", organizationId: "org1", status: WebhookEndpointStatus.ACTIVE, topics: ["user.created"] },
      { id: "ep2", organizationId: "org1", status: WebhookEndpointStatus.ACTIVE, topics: ["user.created", "user.updated"] }
    ];

    prisma.webhookEndpoint.findMany =
      mock.fn(() => Promise.resolve(mockEndpoints)) as unknown as typeof prisma.webhookEndpoint.findMany;

    const addedJobs: Array<{ name: string; data: OutboundWebhookJobPayload }> = [];
    const mockQueue = {
      add: (name: string, data: OutboundWebhookJobPayload) => {
        addedJobs.push({ name, data });
        return Promise.resolve({ id: "job1" });
      }
    } as unknown as Queue<OutboundWebhookJobPayload>;

    await enqueueWebhookTopicDeliveries(mockQueue, {
      organizationId: "org1",
      payload: { userId: "123" },
      tenantId: "tenant1",
      topic: "user.created"
    });

    assert.equal(addedJobs.length, 2);
    const firstJob = addedJobs[0]!;
    const secondJob = addedJobs[1]!;
    assert.equal(firstJob.name, "user.created");
    assert.equal(firstJob.data.endpointId, "ep1");
    assert.equal(firstJob.data.topic, "user.created");
    assert.deepEqual(firstJob.data.payload, { userId: "123" });

    assert.equal(secondJob.name, "user.created");
    assert.equal(secondJob.data.endpointId, "ep2");
  });

  await t.test("processOutboundWebhookJob - skips disabled endpoints", async () => {
    prisma.webhookEndpoint.findUnique = mock.fn(() => Promise.resolve({
      id: "ep1",
      status: WebhookEndpointStatus.DISABLED,
      topics: ["user.created"]
    })) as unknown as typeof prisma.webhookEndpoint.findUnique;

    const result = await processOutboundWebhookJob({
      endpointId: "ep1",
      organizationId: "org1",
      payload: { userId: "123" },
      tenantId: "tenant1",
      topic: "user.created"
    });

    assert.equal(result.skipped, true);
  });

  await t.test("processOutboundWebhookJob - skips endpoints not matching topic", async () => {
    prisma.webhookEndpoint.findUnique = mock.fn(() => Promise.resolve({
      id: "ep1",
      status: WebhookEndpointStatus.ACTIVE,
      topics: ["user.updated"] // missing user.created
    })) as unknown as typeof prisma.webhookEndpoint.findUnique;

    const result = await processOutboundWebhookJob({
      endpointId: "ep1",
      organizationId: "org1",
      payload: { userId: "123" },
      tenantId: "tenant1",
      topic: "user.created"
    });

    assert.equal(result.skipped, true);
  });

  await t.test("processOutboundWebhookJob - successful delivery", async () => {
    const mockEndpoint = {
      id: "ep1",
      status: WebhookEndpointStatus.ACTIVE,
      topics: ["user.created"],
      secret: "supersecret",
      url: "https://example.com/webhook",
      consecutiveFailures: 0
    };

    prisma.webhookEndpoint.findUnique =
      mock.fn(() => Promise.resolve(mockEndpoint)) as unknown as typeof prisma.webhookEndpoint.findUnique;

    const deliveryCreateSpy = mock.fn(() => Promise.resolve({ id: "delivery1" }));
    prisma.webhookDelivery.create = deliveryCreateSpy as unknown as typeof prisma.webhookDelivery.create;

    const deliveryUpdateSpy = mock.fn(() => Promise.resolve({}));
    prisma.webhookDelivery.update = deliveryUpdateSpy as unknown as typeof prisma.webhookDelivery.update;

    const endpointUpdateSpy = mock.fn(() => Promise.resolve({}));
    prisma.webhookEndpoint.update = endpointUpdateSpy as unknown as typeof prisma.webhookEndpoint.update;

    // Mock fetch
    const fetchSpy = t.mock.method(global, "fetch", () => Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve("OK")
    }));

    const result = await processOutboundWebhookJob({
      attempt: 1,
      endpointId: "ep1",
      organizationId: "org1",
      payload: { userId: "123" },
      tenantId: "tenant1",
      topic: "user.created"
    });

    assert.equal(result.skipped, false);
    assert.equal(result.deliveryId, "delivery1");
    assert.equal(result.statusCode, 200);

    // Verify fetch call
    const fetchCalls = readMockCalls(fetchSpy);
    assert.equal(fetchCalls.length, 1);
    const firstFetchCall = fetchCalls[0]!;
    const fetchArgs = firstFetchCall.arguments;
    assert.equal(fetchArgs[0], "https://example.com/webhook");
    const requestInit = fetchArgs[1] as RequestInit;
    assert.equal(requestInit.method, "POST");
    const headers = new Headers(requestInit.headers);
    assert.equal(headers.get("content-type"), "application/json");
    assert.equal(headers.get("x-birthhub-topic"), "user.created");
    // body should be serialized json
    assert.equal(requestInit.body, JSON.stringify({ userId: "123" }));

    // Verify DB updates
    const deliveryUpdateCalls = readMockCalls(deliveryUpdateSpy);
    assert.equal(deliveryUpdateCalls.length, 1);
    const firstDeliveryUpdateArg = deliveryUpdateCalls[0]!.arguments[0] as { data: { success: boolean } };
    assert.equal(firstDeliveryUpdateArg.data.success, true);

    const endpointUpdateCalls = readMockCalls(endpointUpdateSpy);
    assert.equal(endpointUpdateCalls.length, 1);
    const firstEndpointUpdateArg = endpointUpdateCalls[0]!.arguments[0] as { data: { consecutiveFailures: number } };
    assert.equal(firstEndpointUpdateArg.data.consecutiveFailures, 0);
  });

  await t.test("processOutboundWebhookJob - non-200 response marks failure and increments failures", async () => {
    const mockEndpoint = {
      id: "ep1",
      status: WebhookEndpointStatus.ACTIVE,
      topics: ["user.created"],
      secret: "supersecret",
      url: "https://example.com/webhook",
      consecutiveFailures: 2
    };

    prisma.webhookEndpoint.findUnique =
      mock.fn(() => Promise.resolve(mockEndpoint)) as unknown as typeof prisma.webhookEndpoint.findUnique;
    prisma.webhookDelivery.create =
      mock.fn(() => Promise.resolve({ id: "delivery1" })) as unknown as typeof prisma.webhookDelivery.create;

    const deliveryUpdateSpy = mock.fn(() => Promise.resolve({}));
    prisma.webhookDelivery.update = deliveryUpdateSpy as unknown as typeof prisma.webhookDelivery.update;

    const endpointUpdateSpy = mock.fn(() => Promise.resolve({}));
    prisma.webhookEndpoint.update = endpointUpdateSpy as unknown as typeof prisma.webhookEndpoint.update;

    // Mock fetch to return 500
    t.mock.method(global, "fetch", () => Promise.resolve({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error")
    }));

    await assert.rejects(
      () =>
        processOutboundWebhookJob({
          attempt: 1,
          endpointId: "ep1",
          organizationId: "org1",
          payload: { userId: "123" },
          tenantId: "tenant1",
          topic: "user.created"
        }),
      /Webhook delivery failed with status 500/
    );

    // Initial update sets success=false
    const deliveryUpdateCalls = readMockCalls(deliveryUpdateSpy);
    assert.equal(deliveryUpdateCalls.length, 2); // First update in try, second in catch
    const firstDeliveryUpdateArg = deliveryUpdateCalls[0]!.arguments[0] as {
      data: { success: boolean; statusCode: number };
    };
    assert.equal(firstDeliveryUpdateArg.data.success, false);
    assert.equal(firstDeliveryUpdateArg.data.statusCode, 500);

    // Verify endpoint consecutive failures incremented
    const endpointUpdateCalls = readMockCalls(endpointUpdateSpy);
    assert.equal(endpointUpdateCalls.length, 1);
    const firstEndpointUpdateArg = endpointUpdateCalls[0]!.arguments[0] as {
      data: { consecutiveFailures: number; status: WebhookEndpointStatus };
    };
    assert.equal(firstEndpointUpdateArg.data.consecutiveFailures, 3);
    assert.equal(firstEndpointUpdateArg.data.status, WebhookEndpointStatus.ACTIVE);
  });

  await t.test("processOutboundWebhookJob - 10 consecutive failures disables endpoint", async () => {
    const mockEndpoint = {
      id: "ep1",
      status: WebhookEndpointStatus.ACTIVE,
      topics: ["user.created"],
      secret: "supersecret",
      url: "https://example.com/webhook",
      consecutiveFailures: 9
    };

    prisma.webhookEndpoint.findUnique =
      mock.fn(() => Promise.resolve(mockEndpoint)) as unknown as typeof prisma.webhookEndpoint.findUnique;
    prisma.webhookDelivery.create =
      mock.fn(() => Promise.resolve({ id: "delivery1" })) as unknown as typeof prisma.webhookDelivery.create;
    prisma.webhookDelivery.update =
      mock.fn(() => Promise.resolve({})) as unknown as typeof prisma.webhookDelivery.update;

    const endpointUpdateSpy = mock.fn(() => Promise.resolve({}));
    prisma.webhookEndpoint.update = endpointUpdateSpy as unknown as typeof prisma.webhookEndpoint.update;

    mock.method(global, "fetch", () => Promise.resolve({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error")
    }));

    await assert.rejects(
      () =>
        processOutboundWebhookJob({
          endpointId: "ep1",
          organizationId: "org1",
          payload: { userId: "123" },
          tenantId: "tenant1",
          topic: "user.created"
        }),
      /Webhook delivery failed with status 500/
    );

    const endpointUpdateCalls = readMockCalls(endpointUpdateSpy);
    assert.equal(endpointUpdateCalls.length, 1);
    const firstEndpointUpdateArg = endpointUpdateCalls[0]!.arguments[0] as {
      data: { consecutiveFailures: number; status: WebhookEndpointStatus };
    };
    assert.equal(firstEndpointUpdateArg.data.consecutiveFailures, 10);
    assert.equal(firstEndpointUpdateArg.data.status, WebhookEndpointStatus.DISABLED);
  });

  await t.test("processOutboundWebhookJob - network error sets error message", async () => {
    const mockEndpoint = {
      id: "ep1",
      status: WebhookEndpointStatus.ACTIVE,
      topics: ["user.created"],
      secret: "supersecret",
      url: "https://example.com/webhook",
      consecutiveFailures: 0
    };

    prisma.webhookEndpoint.findUnique =
      mock.fn(() => Promise.resolve(mockEndpoint)) as unknown as typeof prisma.webhookEndpoint.findUnique;
    prisma.webhookDelivery.create =
      mock.fn(() => Promise.resolve({ id: "delivery1" })) as unknown as typeof prisma.webhookDelivery.create;

    const deliveryUpdateSpy = mock.fn(() => Promise.resolve({}));
    prisma.webhookDelivery.update = deliveryUpdateSpy as unknown as typeof prisma.webhookDelivery.update;

    const endpointUpdateSpy = mock.fn(() => Promise.resolve({}));
    prisma.webhookEndpoint.update = endpointUpdateSpy as unknown as typeof prisma.webhookEndpoint.update;

    t.mock.method(global, "fetch", () => Promise.reject(new Error("fetch failed")));

    await assert.rejects(
      () =>
        processOutboundWebhookJob({
          endpointId: "ep1",
          organizationId: "org1",
          payload: { userId: "123" },
          tenantId: "tenant1",
          topic: "user.created"
        }),
      /fetch failed/
    );

    const deliveryUpdateCalls = readMockCalls(deliveryUpdateSpy);
    assert.equal(deliveryUpdateCalls.length, 1);
    const firstDeliveryUpdateArg = deliveryUpdateCalls[0]!.arguments[0] as { data: { errorMessage: string } };
    assert.equal(firstDeliveryUpdateArg.data.errorMessage, "fetch failed");

    const endpointUpdateCalls = readMockCalls(endpointUpdateSpy);
    assert.equal(endpointUpdateCalls.length, 1);
    const firstEndpointUpdateArg = endpointUpdateCalls[0]!.arguments[0] as { data: { consecutiveFailures: number } };
    assert.equal(firstEndpointUpdateArg.data.consecutiveFailures, 1);
  });
});
