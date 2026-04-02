import { createLogger } from "@birthub/logger";
import {
  BillingCreditReason,
  Prisma,
  SubscriptionStatus,
  type InvoiceStatus,
  prisma
} from "@birthub/database";
import Stripe from "stripe";

import { ProblemDetailsError } from "../../lib/problem-details.js";
import { type DatabaseClient } from "./service.shared.js";

export const reconciliationLogger: ReturnType<typeof createLogger> =
  createLogger("billing-service");

export function unixToDate(value: number | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  return new Date(value * 1000);
}

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): SubscriptionStatus {
  switch (status) {
    case "active":
      return SubscriptionStatus.active;
    case "canceled":
      return SubscriptionStatus.canceled;
    case "past_due":
    case "incomplete":
    case "incomplete_expired":
    case "unpaid":
      return SubscriptionStatus.past_due;
    case "paused":
      return SubscriptionStatus.paused;
    case "trialing":
      return SubscriptionStatus.trial;
    default:
      return SubscriptionStatus.trial;
  }
}

export async function resolveOrganizationByStripeCustomer(
  customerId: string,
  db: DatabaseClient = prisma
) {
  return db.organization.findFirst({
    where: {
      stripeCustomerId: customerId
    }
  });
}

function resolveInvoiceStatus(
  candidate: Stripe.Invoice.Status | null | undefined,
  fallback: InvoiceStatus
): InvoiceStatus {
  switch (candidate) {
    case "draft":
      return "draft";
    case "open":
      return "open";
    case "paid":
      return "paid";
    case "void":
      return "void";
    case "uncollectible":
      return "uncollectible";
    default:
      return fallback;
  }
}

export function resolveInvoicePeriods(invoice: Stripe.Invoice): {
  periodEnd: Date | null;
  periodStart: Date | null;
} {
  const line = invoice.lines.data[0];
  return {
    periodEnd: unixToDate(line?.period?.end),
    periodStart: unixToDate(line?.period?.start)
  };
}

export function resolveInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subscription = invoice.parent?.subscription_details?.subscription ?? null;

  if (typeof subscription === "string") {
    return subscription;
  }

  return subscription?.id ?? null;
}

export function resolveSubscriptionPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const periodEnds = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number");

  if (periodEnds.length === 0) {
    return unixToDate(
      subscription.trial_end ?? subscription.cancel_at ?? subscription.billing_cycle_anchor
    );
  }

  return unixToDate(Math.max(...periodEnds));
}

function resolveSubscriptionItemUnitAmount(
  item:
    | {
        plan?: {
          amount?: number | null;
        } | null;
        price?: {
          unit_amount?: number | null;
        } | null;
      }
    | null
    | undefined
): number | null {
  if (!item) {
    return null;
  }

  const fromPrice = item.price?.unit_amount;
  if (typeof fromPrice === "number") {
    return fromPrice;
  }

  const fromPlan = item.plan?.amount;
  return typeof fromPlan === "number" ? fromPlan : null;
}

export function resolveProrationCreditCents(
  event: Stripe.Event,
  subscription: Stripe.Subscription
): number {
  const metadataCredit = Number(subscription.metadata?.proration_credit_cents ?? "");

  if (Number.isFinite(metadataCredit) && metadataCredit > 0) {
    return metadataCredit;
  }

  const dataObj = event.data as unknown;
  const isDataWithPreviousAttributes = (
    obj: unknown
  ): obj is {
    previous_attributes?: {
      items?: {
        data?: Array<{
          plan?: { amount?: number | null } | null;
          price?: { unit_amount?: number | null } | null;
        }>;
      };
    };
  } => {
    return typeof obj === "object" && obj !== null && "previous_attributes" in obj;
  };

  const previousAttributes = isDataWithPreviousAttributes(dataObj)
    ? dataObj.previous_attributes
    : undefined;
  const previousAmount = resolveSubscriptionItemUnitAmount(
    previousAttributes?.items?.data?.[0]
  );
  const currentAmount = resolveSubscriptionItemUnitAmount(subscription.items.data[0]);

  if (
    typeof previousAmount === "number" &&
    typeof currentAmount === "number" &&
    previousAmount > currentAmount
  ) {
    return previousAmount - currentAmount;
  }

  return 0;
}

export async function createDowngradeProrationCredit(
  input: {
    amountCents: number;
    currency: string;
    organizationId: string;
    stripeEventId: string;
    stripeInvoiceId?: string | null;
    subscriptionId?: string | null;
    tenantId: string;
  },
  db: DatabaseClient = prisma
): Promise<void> {
  if (input.amountCents <= 0) {
    return;
  }

  try {
    const data: Prisma.BillingCreditUncheckedCreateInput = {
      amountCents: input.amountCents,
      currency: input.currency,
      metadata: {
        source: "customer.subscription.updated"
      },
      organizationId: input.organizationId,
      reason: BillingCreditReason.DOWNGRADE_PRORATION,
      stripeEventId: input.stripeEventId,
      tenantId: input.tenantId,
      ...(input.stripeInvoiceId ? { stripeInvoiceId: input.stripeInvoiceId } : {}),
      ...(input.subscriptionId ? { subscriptionId: input.subscriptionId } : {})
    };

    await db.billingCredit.create({
      data
    });

    reconciliationLogger.info(
      {
        amountCents: input.amountCents,
        event: "billing.credit.proration.created",
        organizationId: input.organizationId,
        stripeEventId: input.stripeEventId,
        subscriptionId: input.subscriptionId ?? null,
        tenantId: input.tenantId
      },
      "Created downgrade proration credit"
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      reconciliationLogger.warn(
        {
          event: "billing.credit.proration.duplicate",
          stripeEventId: input.stripeEventId
        },
        "Duplicate billing credit ignored"
      );
      return;
    }

    throw error;
  }
}

export function buildInvoiceCreateData(input: {
  fallbackStatus: InvoiceStatus;
  invoice: Stripe.Invoice;
  organizationId: string;
  subscriptionId: string;
  tenantId: string;
}): Prisma.InvoiceUncheckedCreateInput {
  const periods = resolveInvoicePeriods(input.invoice);

  return {
    amountDueCents: input.invoice.amount_due,
    amountPaidCents: input.invoice.amount_paid,
    currency: input.invoice.currency,
    dueDate: unixToDate(input.invoice.due_date),
    hostedInvoiceUrl: input.invoice.hosted_invoice_url ?? null,
    invoicePdfUrl: input.invoice.invoice_pdf ?? null,
    organizationId: input.organizationId,
    periodEnd: periods.periodEnd,
    periodStart: periods.periodStart,
    status: resolveInvoiceStatus(input.invoice.status, input.fallbackStatus),
    stripeInvoiceId: input.invoice.id,
    subscriptionId: input.subscriptionId,
    tenantId: input.tenantId
  };
}

export function buildInvoiceUpdateData(
  invoice: Stripe.Invoice,
  fallbackStatus: InvoiceStatus
): Prisma.InvoiceUncheckedUpdateInput {
  const periods = resolveInvoicePeriods(invoice);

  return {
    amountDueCents: invoice.amount_due,
    amountPaidCents: invoice.amount_paid,
    dueDate: unixToDate(invoice.due_date),
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    invoicePdfUrl: invoice.invoice_pdf ?? null,
    periodEnd: periods.periodEnd,
    periodStart: periods.periodStart,
    status: resolveInvoiceStatus(invoice.status, fallbackStatus)
  };
}

export async function ensureSubscriptionForOrganization(
  input: {
    currentPeriodEnd?: Date | null;
    organizationId: string;
    planId: string;
    stripeCustomerId: string;
    stripeSubscriptionId?: string | null;
  },
  db: DatabaseClient = prisma
): Promise<{
  id: string;
  status: SubscriptionStatus;
  tenantId: string;
}> {
  const organization = await db.organization.findUnique({
    where: {
      id: input.organizationId
    }
  });

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found while syncing subscription.",
      status: 404,
      title: "Not Found"
    });
  }

  const createData: Prisma.SubscriptionUncheckedCreateInput = {
    currentPeriodEnd: input.currentPeriodEnd ?? null,
    organizationId: organization.id,
    planId: input.planId,
    status: SubscriptionStatus.active,
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId ?? null,
    tenantId: organization.tenantId
  };
  const updateData: Prisma.SubscriptionUncheckedUpdateInput = {
    planId: input.planId,
    status: SubscriptionStatus.active,
    stripeCustomerId: input.stripeCustomerId,
    ...(input.currentPeriodEnd !== undefined
      ? { currentPeriodEnd: input.currentPeriodEnd }
      : {}),
    ...(input.stripeSubscriptionId !== undefined
      ? { stripeSubscriptionId: input.stripeSubscriptionId }
      : {})
  };

  return db.subscription.upsert({
    create: createData,
    update: updateData,
    where: {
      organizationId: organization.id
    }
  });
}
