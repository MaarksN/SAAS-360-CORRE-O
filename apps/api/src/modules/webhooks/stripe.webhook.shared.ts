import type { ApiConfig } from "@birthub/config";
import { BillingEventStatus, Prisma, prisma } from "@birthub/database";
import { createLogger } from "@birthub/logger";
import type { Request } from "express";
import Redlock from "redlock";
import Stripe from "stripe";

import { ProblemDetailsError } from "../../lib/problem-details.js";
import { toPrismaJsonValue } from "../../lib/prisma-json.js";
import { getSharedRedis } from "../../lib/redis.js";
import { type StripeBillingEventContext } from "../billing/service.js";

export const stripeWebhookLogger: ReturnType<typeof createLogger> =
  createLogger("stripe-webhook");
export const BILLING_WEBHOOK_IDEMPOTENCY_TTL_SECONDS = 86_400;

let stripeRedlock: Redlock | null = null;

export type StripeWebhookEventProcessor = (input: {
  config: ApiConfig;
  db?: typeof prisma | Prisma.TransactionClient;
  event: Stripe.Event;
}) => Promise<StripeBillingEventContext>;

function getStripeRedlock(config: ApiConfig): Redlock {
  if (stripeRedlock) {
    return stripeRedlock;
  }

  stripeRedlock = new Redlock([getSharedRedis(config)], {
    retryCount: 3,
    retryDelay: 200,
    retryJitter: 100
  });

  return stripeRedlock;
}

function resolveLockResource(event: Stripe.Event): string {
  const object = event.data.object;
  const candidate =
    ("customer" in object && typeof object.customer === "string" ? object.customer : null) ??
    ("subscription" in object && typeof object.subscription === "string"
      ? object.subscription
      : null) ??
    ("metadata" in object && typeof object.metadata?.organizationId === "string"
      ? object.metadata.organizationId
      : null) ??
    event.id;

  return `locks:stripe:${candidate}`;
}

export function billingStatusCacheKey(tenantId: string): string {
  return `billing-status:${tenantId}`;
}

export function stripeWebhookIdempotencyKey(eventId: string): string {
  return `idempotency:stripe_webhook:${eventId}`;
}

export async function withStripeEventLock<T>(
  config: ApiConfig,
  event: Stripe.Event,
  callback: () => Promise<T>
): Promise<T> {
  if (config.NODE_ENV === "test") {
    return callback();
  }

  const lock = await getStripeRedlock(config).acquire([resolveLockResource(event)], 10_000);

  try {
    return await callback();
  } finally {
    await lock.release().catch((error) => {
      stripeWebhookLogger.warn(
        {
          err: error,
          stripeEventId: event.id,
          stripeEventType: event.type
        },
        "Failed to release Stripe event lock"
      );
    });
  }
}

function ensureSignature(request: Request): string {
  const signature = request.header("stripe-signature");

  if (signature) {
    return signature;
  }

  stripeWebhookLogger.warn(
    {
      event: "billing.webhook.signature.missing"
    },
    "Stripe webhook rejected because the signature header is missing"
  );

  throw new ProblemDetailsError({
    detail: "Missing Stripe signature header.",
    status: 400,
    title: "Bad Request"
  });
}

function ensureRawBody(request: Request): Buffer {
  if (Buffer.isBuffer(request.body)) {
    return request.body;
  }

  throw new ProblemDetailsError({
    detail: "Stripe webhook payload must be read as raw body.",
    status: 400,
    title: "Bad Request"
  });
}

function parseStripeSignatureTimestamp(signature: string): Date {
  const timestampFragment = signature
    .split(",")
    .map((fragment) => fragment.trim())
    .find((fragment) => fragment.startsWith("t="));

  if (!timestampFragment) {
    throw new ProblemDetailsError({
      detail: "Stripe webhook signature is missing the timestamp component.",
      status: 400,
      title: "Bad Request"
    });
  }

  const timestampSeconds = Number(timestampFragment.slice(2));

  if (!Number.isInteger(timestampSeconds) || timestampSeconds <= 0) {
    throw new ProblemDetailsError({
      detail: "Stripe webhook signature contains an invalid timestamp.",
      status: 400,
      title: "Bad Request"
    });
  }

  return new Date(timestampSeconds * 1000);
}

function ensureWebhookWithinReplayWindow(
  signatureTimestamp: Date,
  toleranceSeconds: number
): void {
  const driftMs = Math.abs(Date.now() - signatureTimestamp.getTime());

  if (driftMs <= toleranceSeconds * 1000) {
    return;
  }

  throw new ProblemDetailsError({
    detail: "Stripe webhook timestamp is outside the replay protection window.",
    status: 400,
    title: "Bad Request"
  });
}

function resolveStripeEventCreatedAt(event: Stripe.Event): Date | null {
  return typeof event.created === "number" ? new Date(event.created * 1000) : null;
}

export function toWebhookErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return raw.slice(0, 1_000);
}

export function constructStripeEvent(input: {
  request: Request;
  config: ApiConfig;
  stripe: Stripe;
}): {
  event: Stripe.Event;
  signatureTimestamp: Date;
} {
  const signature = ensureSignature(input.request);
  const body = ensureRawBody(input.request);
  const signatureTimestamp = parseStripeSignatureTimestamp(signature);
  let event: Stripe.Event;

  try {
    event = input.stripe.webhooks.constructEvent(
      body,
      signature,
      input.config.STRIPE_WEBHOOK_SECRET,
      Number.MAX_SAFE_INTEGER
    );
  } catch (error) {
    stripeWebhookLogger.warn(
      {
        err: error,
        event: "billing.webhook.signature.invalid"
      },
      "Stripe webhook rejected because the signature is invalid"
    );

    throw new ProblemDetailsError({
      detail: "Invalid Stripe webhook signature.",
      errors: error instanceof Error ? error.message : "unknown_signature_error",
      status: 400,
      title: "Bad Request"
    });
  }

  try {
    ensureWebhookWithinReplayWindow(
      signatureTimestamp,
      input.config.STRIPE_WEBHOOK_TOLERANCE_SECONDS
    );
  } catch (error) {
    stripeWebhookLogger.warn(
      {
        event: "billing.webhook.replay_rejected",
        signatureTimestamp: signatureTimestamp.toISOString(),
        stripeEventId: event.id,
        stripeEventType: event.type,
        toleranceSeconds: input.config.STRIPE_WEBHOOK_TOLERANCE_SECONDS
      },
      "Stripe webhook rejected because it is outside the replay window"
    );
    throw error;
  }

  return { event, signatureTimestamp };
}

export async function createReceivedBillingEvent(input: {
  event: Stripe.Event;
  signatureTimestamp: Date;
}) {
  try {
    return await prisma.billingEvent.create({
      data: {
        attemptCount: 0,
        eventCreatedAt: resolveStripeEventCreatedAt(input.event),
        payload: toPrismaJsonValue(input.event),
        signatureTimestamp: input.signatureTimestamp,
        status: BillingEventStatus.received,
        stripeEventId: input.event.id,
        type: input.event.type
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.billingEvent.findUnique({
        where: {
          stripeEventId: input.event.id
        }
      });

      if (existing) {
        return existing;
      }
    }

    throw error;
  }
}

export async function markBillingEventProcessing(input: {
  event: Stripe.Event;
  signatureTimestamp: Date;
}) {
  return prisma.billingEvent.update({
    data: {
      attemptCount: {
        increment: 1
      },
      eventCreatedAt: resolveStripeEventCreatedAt(input.event),
      failedAt: null,
      lastError: null,
      payload: toPrismaJsonValue(input.event),
      processedAt: null,
      signatureTimestamp: input.signatureTimestamp,
      status: BillingEventStatus.processing,
      type: input.event.type
    },
    where: {
      stripeEventId: input.event.id
    }
  });
}
