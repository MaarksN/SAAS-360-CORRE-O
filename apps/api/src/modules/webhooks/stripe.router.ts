import type { ApiConfig } from "@birthub/config";
import { Prisma, prisma } from "@birthub/database";
import express, { Router } from "express";
import Stripe from "stripe";

import { asyncHandler } from "../../lib/problem-details.js";
import {
  processStripeBillingEvent as processStripeBillingDomainEvent,
  type StripeBillingEventContext
} from "../billing/service.js";
import { createStripeClient } from "../billing/stripe.client.js";
import { processStripeWebhookRequest } from "./stripe.webhook.processing.js";

type StripeWebhookEventProcessor = (input: {
  config: ApiConfig;
  db?: typeof prisma | Prisma.TransactionClient;
  event: Stripe.Event;
}) => Promise<StripeBillingEventContext>;

export interface StripeWebhookRouterDependencies {
  processStripeBillingEvent?: StripeWebhookEventProcessor;
}

export function createStripeWebhookRouter(
  config: ApiConfig,
  dependencies: StripeWebhookRouterDependencies = {}
): Router {
  const router = Router();
  const stripe = createStripeClient(config);
  const processStripeBillingEvent =
    dependencies.processStripeBillingEvent ?? processStripeBillingDomainEvent;

  router.post(
    "/stripe",
    express.raw({ type: "application/json" }),
    asyncHandler(async (request, response) => {
      const result = await processStripeWebhookRequest({
        config,
        processStripeBillingEvent,
        request,
        stripe
      });

      response.status(200).json(result);
    })
  );

  return router;
}
