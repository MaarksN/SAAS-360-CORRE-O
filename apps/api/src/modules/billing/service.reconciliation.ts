import type { ApiConfig } from "@birthub/config";
import { prisma } from "@birthub/database";
import Stripe from "stripe";

import { type DatabaseClient, type StripeBillingEventContext } from "./service.shared.js";
import {
  handleCheckoutSessionCompleted,
  handleCustomerSubscriptionDeleted,
  handleCustomerSubscriptionUpdated,
  handleInvoicePaymentFailed,
  handleInvoicePaymentSucceeded
} from "./service.reconciliation.handlers.js";
import { reconciliationLogger } from "./service.reconciliation.shared.js";

export async function processStripeBillingEvent(input: {
  config: ApiConfig;
  db?: DatabaseClient;
  event: Stripe.Event;
}): Promise<StripeBillingEventContext> {
  const db = input.db ?? prisma;

  try {
    switch (input.event.type) {
      case "checkout.session.completed":
        return handleCheckoutSessionCompleted(input.event.data.object, db);
      case "invoice.payment_succeeded":
        return handleInvoicePaymentSucceeded(input.event.data.object, db);
      case "invoice.payment_failed":
        return handleInvoicePaymentFailed(input.event.data.object, input.config, db);
      case "customer.subscription.deleted":
        return handleCustomerSubscriptionDeleted(input.event.data.object, db);
      case "customer.subscription.updated":
        return handleCustomerSubscriptionUpdated(input.event, db);
      default:
        reconciliationLogger.info(
          {
            event: "billing.webhook.ignored",
            stripeEventId: input.event.id,
            stripeEventType: input.event.type
          },
          "Ignoring unsupported Stripe billing event"
        );
        return {};
    }
  } catch (error) {
    reconciliationLogger.error(
      {
        err: error,
        event: "billing.webhook.processing_failed",
        stripeEventId: input.event.id,
        stripeEventType: input.event.type
      },
      "Failed to process Stripe billing event"
    );
    throw error;
  }
}
