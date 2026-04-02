import assert from "node:assert/strict";
import test from "node:test";

import { createLogger, runWithLogContext } from "./index.js";

function parseJsonObject(raw: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new TypeError("Expected logger JSON line to be an object.");
  }

  return parsed as Record<string, unknown>;
}

async function captureStdout(callback: () => void): Promise<Record<string, unknown>> {
  const chunks: string[] = [];
  const originalWrite = process.stdout.write.bind(process.stdout);

  process.stdout.write = ((chunk: unknown, encoding?: BufferEncoding | (() => void), callbackFn?: () => void) => {
    const rendered =
      typeof chunk === "string"
        ? chunk
        : Buffer.isBuffer(chunk)
          ? chunk.toString(typeof encoding === "string" ? encoding : "utf8")
          : String(chunk);

    chunks.push(rendered);

    if (typeof encoding === "function") {
      encoding();
    } else if (typeof callbackFn === "function") {
      callbackFn();
    }

    return true;
  }) as typeof process.stdout.write;

  try {
    callback();
    await new Promise((resolve) => setImmediate(resolve));
  } finally {
    process.stdout.write = originalWrite;
  }

  const rawLine = chunks
    .join("")
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith("{"));

  assert.ok(rawLine, "Expected logger to emit one JSON line.");
  return parseJsonObject(rawLine);
}

void test("logger emits structured observability fields in camelCase and snake_case", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousLogLevel = process.env.LOG_LEVEL;
  const previousSampleRate = process.env.LOG_SAMPLE_RATE;

  process.env.NODE_ENV = "production";
  process.env.LOG_LEVEL = "info";
  process.env.LOG_SAMPLE_RATE = "1";

  try {
    const payload = await captureStdout(() =>
      runWithLogContext(
        {
          jobId: "job_123",
          operation: "billing.webhook",
          requestId: "req_123",
          tenantId: "tenant_123",
          traceId: "trace_123",
          userId: "user_123"
        },
        () => {
          const logger = createLogger("worker");
          logger.info(
            {
              context: {
                phase: "webhook"
              },
              event: "billing.webhook.received"
            },
            "Webhook accepted"
          );
        }
      )
    );

    assert.equal(payload.level, "info");
    assert.equal(payload.service, "worker");
    assert.equal(payload.message, "Webhook accepted");
    assert.equal(payload.event, "billing.webhook.received");
    assert.equal(payload.requestId, "req_123");
    assert.equal(payload.request_id, "req_123");
    assert.equal(payload.traceId, "trace_123");
    assert.equal(payload.trace_id, "trace_123");
    assert.equal(payload.tenantId, "tenant_123");
    assert.equal(payload.tenant_id, "tenant_123");
    assert.equal(payload.userId, "user_123");
    assert.equal(payload.user_id, "user_123");
    assert.equal(payload.jobId, "job_123");
    assert.equal(payload.job_id, "job_123");
    assert.equal(payload.operation, "billing.webhook");
    assert.deepEqual(payload.context, { phase: "webhook" });
    assert.ok(typeof payload.timestamp === "string");
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
    process.env.LOG_LEVEL = previousLogLevel;
    process.env.LOG_SAMPLE_RATE = previousSampleRate;
  }
});

void test("logger redacts sensitive fields", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousLogLevel = process.env.LOG_LEVEL;
  const previousSampleRate = process.env.LOG_SAMPLE_RATE;

  process.env.NODE_ENV = "production";
  process.env.LOG_LEVEL = "info";
  process.env.LOG_SAMPLE_RATE = "1";

  try {
    const payload = await captureStdout(() => {
      const logger = createLogger("api");
      logger.info(
        {
          authorization: "Bearer secret",
          context: {
            sessionId: "sess_nested"
          },
          email: "user@example.com",
          headers: {
            cookie: "bh360_session=secret-cookie"
          },
          password: "hidden",
          refreshToken: "token-value",
          sessionId: "sess_top_level"
        },
        "Sensitive payload"
      );
    });

    assert.equal(payload.authorization, "[REDACTED]");
    assert.equal(payload.email, "[REDACTED]");
    assert.deepEqual(payload.context, { sessionId: "[REDACTED]" });
    assert.deepEqual(payload.headers, { cookie: "[REDACTED]" });
    assert.equal(payload.password, "[REDACTED]");
    assert.equal(payload.refreshToken, "[REDACTED]");
    assert.equal(payload.sessionId, "[REDACTED]");
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
    process.env.LOG_LEVEL = previousLogLevel;
    process.env.LOG_SAMPLE_RATE = previousSampleRate;
  }
});
