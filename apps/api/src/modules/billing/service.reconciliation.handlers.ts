import type { ApiConfig } from "@birthub/config";
import { SubscriptionStatus } from "@birthub/database";
import Stripe from "stripe";

import { ProblemDetailsError } from "../../lib/problem-details.js";
import {
  ensurePlanByCode,
  type DatabaseClient,
  type StripeBillingEventContext
} from "./service.shared.js";
import {
  buildInvoiceCreateData,
  buildInvoiceUpdateData,
  createDowngradeProrationCredit,
  ensureSubscriptionForOrganization,
  mapStripeSubscriptionStatus,
  reconciliationLogger,
  resolveInvoicePeriods,
  resolveInvoiceSubscriptionId,
  resolveOrganizationByStripeCustomer,
  resolveProrationCreditCents,
  resolveSubscriptionPeriodEnd,
  unixToDate
} from "./service.reconciliation.shared.js";

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  db: DatabaseClient
): Promise<Required<StripeBillingEventContext>> {
  const customerId = typeof session.customer === "string" ? session.customer : null;
  const metadataOrganizationId = session.metadata?.organizationId;
  let organization = metadataOrganizationId
    ? await db.organization.findUnique({
        where: {
          id: metadataOrganizationId
        }
      })
    : null;

  if (!organization && customerId) {
    organization = await resolveOrganizationByStripeCustomer(customerId, db);
  }

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found for checkout.session.completed event.",
      status: 404,
      title: "Not Found"
    });
  }

  const requestedPlanId = session.metadata?.planId;
  const fallbackPlan = await ensurePlanByCode("starter", db);
  const plan = requestedPlanId
    ? await db.plan.findUnique({
        where: {
          id: requestedPlanId
        }
      })
    : null;
  const planId = plan?.id ?? organization.planId ?? fallbackPlan.id;
  const stripeSubscriptionId =
    typeof session.subscription === "string" ? session.subscription : null;

  await db.organization.update({
    data: {
      planId,
      stripeCustomerId: customerId ?? organization.stripeCustomerId
    },
    where: {
      id: organization.id
    }
  });

  const localSubscription = await ensureSubscriptionForOrganization(
    {
      currentPeriodEnd: unixToDate(session.expires_at),
      organizationId: organization.id,
      planId,
      stripeCustomerId: customerId ?? organization.stripeCustomerId ?? "",
      stripeSubscriptionId
    },
    db
  );

  reconciliationLogger.info(
    {
      checkoutSessionId: session.id,
      event: "billing.webhook.checkout.completed",
      organizationId: organization.id,
      planId,
      stripeCustomerId: customerId ?? organization.stripeCustomerId ?? null,
      stripeSubscriptionId,
      subscriptionId: localSubscription.id,
      tenantId: organization.tenantId
    },
    "Processed checkout.session.completed event"
  );

  return {
    organizationId: organization.id,
    tenantId: organization.tenantId
  };
}

export async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  db: DatabaseClient
): Promise<Required<StripeBillingEventContext>> {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : null;

  if (!customerId) {
    throw new ProblemDetailsError({
      detail: "Stripe invoice is missing customer id.",
      status: 400,
      title: "Bad Request"
    });
  }

  const organization = await resolveOrganizationByStripeCustomer(customerId, db);

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found for invoice.payment_succeeded event.",
      status: 404,
      title: "Not Found"
    });
  }

  const planId = organization.planId ?? (await ensurePlanByCode("starter", db)).id;
  const stripeSubscriptionId = resolveInvoiceSubscriptionId(invoice);
  const periods = resolveInvoicePeriods(invoice);
  const existingSubscription = await ensureSubscriptionForOrganization(
    {
      currentPeriodEnd: periods.periodEnd,
      organizationId: organization.id,
      planId,
      stripeCustomerId: customerId,
      stripeSubscriptionId
    },
    db
  );

  await db.subscription.update({
    data: {
      currentPeriodEnd: periods.periodEnd,
      gracePeriodEndsAt: null,
      status: SubscriptionStatus.active
    },
    where: {
      id: existingSubscription.id
    }
  });

  await db.invoice.upsert({
    create: buildInvoiceCreateData({
      fallbackStatus: "paid",
      invoice,
      organizationId: organization.id,
      subscriptionId: existingSubscription.id,
      tenantId: organization.tenantId
    }),
    update: buildInvoiceUpdateData(invoice, "paid"),
    where: {
      stripeInvoiceId: invoice.id
    }
  });

  reconciliationLogger.info(
    {
      event: "billing.webhook.invoice.payment_succeeded",
      invoiceId: invoice.id,
      organizationId: organization.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId,
      subscriptionId: existingSubscription.id,
      tenantId: organization.tenantId
    },
    "Processed invoice.payment_succeeded event"
  );

  reconciliationLogger.info(
    {
      event: "billing.subscription.reactivated",
      invoiceId: invoice.id,
      organizationId: organization.id,
      tenantId: organization.tenantId
    },
    "Subscription reactivated after successful invoice payment"
  );

  return {
    organizationId: organization.id,
    tenantId: organization.tenantId
  };
}

export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  config: ApiConfig,
  db: DatabaseClient
): Promise<Required<StripeBillingEventContext>> {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : null;

  if (!customerId) {
    throw new ProblemDetailsError({
      detail: "Stripe invoice is missing customer id.",
      status: 400,
      title: "Bad Request"
    });
  }

  const organization = await resolveOrganizationByStripeCustomer(customerId, db);

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found for invoice.payment_failed event.",
      status: 404,
      title: "Not Found"
    });
  }

  const planId = organization.planId ?? (await ensurePlanByCode("starter", db)).id;
  const stripeSubscriptionId = resolveInvoiceSubscriptionId(invoice);
  const periods = resolveInvoicePeriods(invoice);
  const gracePeriodEndsAt = new Date(
    Date.now() + config.BILLING_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
  );
  const subscription = await ensureSubscriptionForOrganization(
    {
      currentPeriodEnd: periods.periodEnd,
      organizationId: organization.id,
      planId,
      stripeCustomerId: customerId,
      stripeSubscriptionId
    },
    db
  );

  await db.subscription.update({
    data: {
      gracePeriodEndsAt,
      status: SubscriptionStatus.past_due
    },
    where: {
      id: subscription.id
    }
  });

  await db.invoice.upsert({
    create: buildInvoiceCreateData({
      fallbackStatus: "past_due",
      invoice,
      organizationId: organization.id,
      subscriptionId: subscription.id,
      tenantId: organization.tenantId
    }),
    update: buildInvoiceUpdateData(invoice, "past_due"),
    where: {
      stripeInvoiceId: invoice.id
    }
  });

  reconciliationLogger.info(
    {
      event: "billing.webhook.invoice.payment_failed",
      gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
      invoiceId: invoice.id,
      organizationId: organization.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId,
      subscriptionId: subscription.id,
      tenantId: organization.tenantId
    },
    "Processed invoice.payment_failed event"
  );

  reconciliationLogger.info(
    {
      event: "billing.dunning.triggered",
      invoiceId: invoice.id,
      organizationId: organization.id,
      tenantId: organization.tenantId
    },
    "Dunning flow triggered after failed invoice payment"
  );

  return {
    organizationId: organization.id,
    tenantId: organization.tenantId
  };
}

export async function handleCustomerSubscriptionDeleted(
  subscription: Stripe.Subscription,
  db: DatabaseClient
): Promise<Required<StripeBillingEventContext>> {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : null;

  if (!customerId) {
    throw new ProblemDetailsError({
      detail: "Stripe subscription is missing customer id.",
      status: 400,
      title: "Bad Request"
    });
  }

  const organization = await resolveOrganizationByStripeCustomer(customerId, db);

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found for customer.subscription.deleted event.",
      status: 404,
      title: "Not Found"
    });
  }

  const starter = await ensurePlanByCode("starter", db);

  await db.organization.update({
    data: {
      planId: starter.id
    },
    where: {
      id: organization.id
    }
  });

  await db.subscription.updateMany({
    data: {
      canceledAt: new Date(),
      planId: starter.id,
      status: SubscriptionStatus.canceled,
      stripeSubscriptionId: subscription.id
    },
    where: {
      organizationId: organization.id
    }
  });

  reconciliationLogger.info(
    {
      event: "billing.webhook.subscription.deleted",
      organizationId: organization.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      tenantId: organization.tenantId
    },
    "Processed customer.subscription.deleted event"
  );

  return {
    organizationId: organization.id,
    tenantId: organization.tenantId
  };
}

export async function handleCustomerSubscriptionUpdated(
  event: Stripe.Event,
  db: DatabaseClient
): Promise<Required<StripeBillingEventContext>> {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : null;

  if (!customerId) {
    throw new ProblemDetailsError({
      detail: "Stripe subscription is missing customer id.",
      status: 400,
      title: "Bad Request"
    });
  }

  const organization = await resolveOrganizationByStripeCustomer(customerId, db);

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found for customer.subscription.updated event.",
      status: 404,
      title: "Not Found"
    });
  }

  const stripePriceId = subscription.items.data[0]?.price?.id;
  const mappedPlan = stripePriceId
    ? await db.plan.findFirst({
        where: {
          stripePriceId
        }
      })
    : null;
  const planId =
    mappedPlan?.id ?? organization.planId ?? (await ensurePlanByCode("starter", db)).id;

  await db.organization.update({
    data: {
      planId
    },
    where: {
      id: organization.id
    }
  });

  const localSubscription = await ensureSubscriptionForOrganization(
    {
      currentPeriodEnd: resolveSubscriptionPeriodEnd(subscription),
      organizationId: organization.id,
      planId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id
    },
    db
  );

  await db.subscription.updateMany({
    data: {
      canceledAt: unixToDate(subscription.canceled_at),
      currentPeriodEnd: resolveSubscriptionPeriodEnd(subscription),
      status: mapStripeSubscriptionStatus(subscription.status)
    },
    where: {
      organizationId: organization.id
    }
  });

  await createDowngradeProrationCredit(
    {
      amountCents: resolveProrationCreditCents(event, subscription),
      currency:
        subscription.items.data[0]?.price?.currency ?? mappedPlan?.currency ?? "usd",
      organizationId: organization.id,
      stripeEventId: event.id,
      stripeInvoiceId:
        typeof subscription.latest_invoice === "string"
          ? subscription.latest_invoice
          : subscription.latest_invoice?.id ?? null,
      subscriptionId: localSubscription.id,
      tenantId: organization.tenantId
    },
    db
  );

  reconciliationLogger.info(
    {
      event: "billing.webhook.subscription.updated",
      organizationId: organization.id,
      planId,
      status: subscription.status,
      stripeCustomerId: customerId,
      stripeEventId: event.id,
      stripeSubscriptionId: subscription.id,
      subscriptionId: localSubscription.id,
      tenantId: organization.tenantId
    },
    "Processed customer.subscription.updated event"
  );

  return {
    organizationId: organization.id,
    tenantId: organization.tenantId
  };
}
