import type { ApiConfig } from "@birthub/config";
import { BillingEventStatus, prisma } from "@birthub/database";
import type { Request } from "express";
import Stripe from "stripe";

import {
  deleteCacheKeys,
  readCacheValue,
  writeCacheValue
} from "../../common/cache/cache-store.js";
import { captureWebhookException } from "../../observability/sentry.js";
import {
  invalidateBillingSnapshotCache,
  type StripeBillingEventContext
} from "../billing/service.js";
import { enqueueCrmSync } from "../engagement/queues.js";
import {
  BILLING_WEBHOOK_IDEMPOTENCY_TTL_SECONDS,
  billingStatusCacheKey,
  constructStripeEvent,
  createReceivedBillingEvent,
  markBillingEventProcessing,
  stripeWebhookIdempotencyKey,
  stripeWebhookLogger,
  toWebhookErrorMessage,
  type StripeWebhookEventProcessor,
  withStripeEventLock
} from "./stripe.webhook.shared.js";

type StripeWebhookProcessResult = {
  idempotent: boolean;
  received: boolean;
};

async function readDuplicateResult(
  event: Stripe.Event,
  idempotencyKey: string
): Promise<StripeWebhookProcessResult | null> {
  const cachedIdempotency = await readCacheValue(idempotencyKey);

  if (!cachedIdempotency) {
    return null;
  }

  const processedRecord = await prisma.billingEvent.findUnique({
    where: {
      stripeEventId: event.id
    }
  });

  if (processedRecord?.status === BillingEventStatus.processed) {
    stripeWebhookLogger.info(
      {
        event: "billing.webhook.duplicate.cache_hit",
        stripeEventId: event.id,
        stripeEventType: event.type
      },
      "Ignoring duplicate Stripe billing event via cache idempotency"
    );

    return {
      idempotent: true,
      received: true
    };
  }

  await deleteCacheKeys([idempotencyKey]);
  return null;
}

async function ensurePendingBillingEvent(
  event: Stripe.Event,
  signatureTimestamp: Date
) {
  const existing = await prisma.billingEvent.findUnique({
    where: {
      stripeEventId: event.id
    }
  });

  if (!existing) {
    return createReceivedBillingEvent({ event, signatureTimestamp });
  }

  return existing;
}

async function persistProcessedCache(
  context: StripeBillingEventContext,
  event: Stripe.Event,
  idempotencyKey: string,
  request: Request
): Promise<void> {
  try {
    await writeCacheValue(
      idempotencyKey,
      "processed",
      BILLING_WEBHOOK_IDEMPOTENCY_TTL_SECONDS
    );
  } catch (error) {
    stripeWebhookLogger.error(
      {
        err: error,
        event: "billing.webhook.idempotency.write_failed",
        organizationId: context.organizationId ?? null,
        stripeEventId: event.id,
        tenantId: context.tenantId ?? null
      },
      "Failed to write Stripe webhook idempotency cache"
    );

    captureWebhookException(error, {
      organizationId: context.organizationId,
      requestId: request.context?.requestId,
      stripeEventId: event.id,
      stripeEventType: event.type,
      tenantId: context.tenantId,
      traceId: request.context?.traceId
    });
  }
}

async function runPostCommitSideEffects(
  config: ApiConfig,
  context: StripeBillingEventContext,
  event: Stripe.Event,
  request: Request
): Promise<void> {
  try {
    if (context.tenantId || context.organizationId) {
      await Promise.all([
        invalidateBillingSnapshotCache([context.organizationId, context.tenantId]),
        ...(context.tenantId
          ? [deleteCacheKeys([billingStatusCacheKey(context.tenantId)])]
          : [])
      ]);
    }

    if (
      config.NODE_ENV !== "test" &&
      context.organizationId &&
      context.tenantId &&
      (event.type === "checkout.session.completed" ||
        event.type === "customer.subscription.updated")
    ) {
      await enqueueCrmSync(config, {
        kind: "company-upsert",
        organizationId: context.organizationId,
        tenantId: context.tenantId
      });
    }
  } catch (error) {
    stripeWebhookLogger.error(
      {
        err: error,
        event: "billing.webhook.post_commit_failed",
        organizationId: context.organizationId ?? null,
        stripeEventId: event.id,
        stripeEventType: event.type,
        tenantId: context.tenantId ?? null
      },
      "Post-commit Stripe webhook side effect failed"
    );

    captureWebhookException(error, {
      organizationId: context.organizationId,
      requestId: request.context?.requestId,
      stripeEventId: event.id,
      stripeEventType: event.type,
      tenantId: context.tenantId,
      traceId: request.context?.traceId
    });
  }
}

async function processStripeDomainEvent(input: {
  config: ApiConfig;
  event: Stripe.Event;
  processStripeBillingEvent: StripeWebhookEventProcessor;
}): Promise<StripeBillingEventContext> {
  return prisma.$transaction(async (tx) => {
    const context = await input.processStripeBillingEvent({
      config: input.config,
      db: tx,
      event: input.event
    });

    await tx.billingEvent.update({
      data: {
        failedAt: null,
        lastError: null,
        organizationId: context.organizationId ?? null,
        processedAt: new Date(),
        status: BillingEventStatus.processed,
        tenantId: context.tenantId ?? null
      },
      where: {
        stripeEventId: input.event.id
      }
    });

    return context;
  });
}

async function processLockedStripeEvent(input: {
  config: ApiConfig;
  event: Stripe.Event;
  processStripeBillingEvent: StripeWebhookEventProcessor;
  request: Request;
  signatureTimestamp: Date;
}): Promise<StripeWebhookProcessResult> {
  const idempotencyKey = stripeWebhookIdempotencyKey(input.event.id);
  const duplicateResult = await readDuplicateResult(input.event, idempotencyKey);

  if (duplicateResult) {
    return duplicateResult;
  }

  const billingEvent = await ensurePendingBillingEvent(input.event, input.signatureTimestamp);

  if (billingEvent.status === BillingEventStatus.processed) {
    await writeCacheValue(
      idempotencyKey,
      "processed",
      BILLING_WEBHOOK_IDEMPOTENCY_TTL_SECONDS
    ).catch(() => undefined);

    stripeWebhookLogger.info(
      {
        event: "billing.webhook.duplicate",
        stripeEventId: input.event.id,
        stripeEventType: input.event.type
      },
      "Ignoring duplicate Stripe billing event"
    );

    return {
      idempotent: true,
      received: true
    };
  }

  await markBillingEventProcessing({
    event: input.event,
    signatureTimestamp: input.signatureTimestamp
  });

  let context: StripeBillingEventContext;

  try {
    context = await processStripeDomainEvent({
      config: input.config,
      event: input.event,
      processStripeBillingEvent: input.processStripeBillingEvent
    });
  } catch (error) {
    await prisma.billingEvent.update({
      data: {
        failedAt: new Date(),
        lastError: toWebhookErrorMessage(error),
        status: BillingEventStatus.failed
      },
      where: {
        stripeEventId: input.event.id
      }
    });

    stripeWebhookLogger.error(
      {
        err: error,
        event: "billing.webhook.processing_failed",
        stripeEventId: input.event.id,
        stripeEventType: input.event.type
      },
      "Failed to process Stripe billing event"
    );

    captureWebhookException(error, {
      requestId: input.request.context?.requestId,
      stripeEventId: input.event.id,
      stripeEventType: input.event.type,
      traceId: input.request.context?.traceId
    });

    throw error;
  }

  await persistProcessedCache(context, input.event, idempotencyKey, input.request);
  await runPostCommitSideEffects(input.config, context, input.event, input.request);

  stripeWebhookLogger.info(
    {
      event: "billing.webhook.processed",
      organizationId: context.organizationId ?? null,
      stripeEventId: input.event.id,
      stripeEventType: input.event.type,
      tenantId: context.tenantId ?? null
    },
    "Processed Stripe billing event"
  );

  return {
    idempotent: false,
    received: true
  };
}

export async function processStripeWebhookRequest(input: {
  config: ApiConfig;
  processStripeBillingEvent: StripeWebhookEventProcessor;
  request: Request;
  stripe: Stripe;
}): Promise<StripeWebhookProcessResult> {
  const { event, signatureTimestamp } = constructStripeEvent({
    config: input.config,
    request: input.request,
    stripe: input.stripe
  });

  return withStripeEventLock(input.config, event, () =>
    processLockedStripeEvent({
      config: input.config,
      event,
      processStripeBillingEvent: input.processStripeBillingEvent,
      request: input.request,
      signatureTimestamp
    })
  );
}
