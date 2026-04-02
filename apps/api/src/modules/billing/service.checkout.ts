import type { ApiConfig } from "@birthub/config";
import { createLogger } from "@birthub/logger";
import {
  Role,
  SubscriptionStatus,
  prisma,
  type Prisma
} from "@birthub/database";
import Stripe from "stripe";

import { ProblemDetailsError } from "../../lib/problem-details.js";
import { createStripeClient } from "./stripe.client.js";
import {
  findOrganizationByReference,
  type DatabaseClient
} from "./service.shared.js";

const logger = createLogger("billing-service");

function normalizeStripeLocale(
  locale: string | null | undefined
): Stripe.Checkout.SessionCreateParams.Locale | undefined {
  if (!locale) {
    return undefined;
  }

  const normalized = locale.toLowerCase();
  const byPrefix: Record<string, Stripe.Checkout.SessionCreateParams.Locale> = {
    en: "en",
    "en-us": "en",
    es: "es",
    fr: "fr",
    it: "it",
    pt: "pt-BR",
    "pt-br": "pt-BR"
  };

  return byPrefix[normalized] ?? byPrefix[normalized.split("-")[0] ?? ""] ?? undefined;
}

function readOrganizationSetting(
  settings: Prisma.JsonValue | null | undefined,
  key: string
): string | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return null;
  }

  const value = (settings as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export async function provisionStripeCustomerForOrganization(input: {
  client?: DatabaseClient;
  config: ApiConfig;
  email: string;
  name: string;
  organizationReference: string;
}): Promise<string> {
  const client = input.client ?? prisma;
  const organization = await findOrganizationByReference(input.organizationReference, client);

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found when provisioning Stripe customer.",
      status: 404,
      title: "Not Found"
    });
  }

  if (organization.stripeCustomerId) {
    return organization.stripeCustomerId;
  }

  const stripe = createStripeClient(input.config);
  const customer = await stripe.customers.create({
    email: input.email,
    metadata: {
      organizationId: organization.id,
      tenantId: organization.tenantId
    },
    name: input.name
  });

  await client.organization.update({
    data: {
      stripeCustomerId: customer.id
    },
    where: {
      id: organization.id
    }
  });

  await client.subscription.updateMany({
    data: {
      stripeCustomerId: customer.id
    },
    where: {
      organizationId: organization.id
    }
  });

  logger.info(
    {
      event: "billing.customer.provisioned",
      organizationId: organization.id,
      stripeCustomerId: customer.id,
      tenantId: organization.tenantId
    },
    "Provisioned Stripe customer for organization"
  );

  return customer.id;
}

async function resolveCustomerForCheckout(input: {
  config: ApiConfig;
  organizationReference: string;
}): Promise<string> {
  const organization = await prisma.organization.findFirst({
    include: {
      memberships: {
        include: {
          user: true
        },
        orderBy: {
          createdAt: "asc"
        },
        take: 1,
        where: {
          role: Role.OWNER
        }
      }
    },
    where: {
      OR: [{ id: input.organizationReference }, { tenantId: input.organizationReference }]
    }
  });

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found for checkout.",
      status: 404,
      title: "Not Found"
    });
  }

  if (organization.stripeCustomerId) {
    return organization.stripeCustomerId;
  }

  const owner = organization.memberships[0]?.user;
  const email = owner?.email ?? `billing+${organization.tenantId}@birthub.local`;
  const name = owner?.name ?? organization.name;

  return provisionStripeCustomerForOrganization({
    config: input.config,
    email,
    name,
    organizationReference: organization.id
  });
}

export async function createCheckoutSessionForOrganization(input: {
  config: ApiConfig;
  countryCode?: string | null;
  locale?: string | null;
  organizationReference: string;
  planId: string;
  stripeClient?: Stripe;
}) {
  const organization = await findOrganizationByReference(input.organizationReference);

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found for checkout.",
      status: 404,
      title: "Not Found"
    });
  }

  const plan = await prisma.plan.findUnique({
    where: {
      id: input.planId
    }
  });

  if (!plan || !plan.active) {
    throw new ProblemDetailsError({
      detail: "Requested plan is not available.",
      status: 404,
      title: "Not Found"
    });
  }

  if (!plan.stripePriceId) {
    throw new ProblemDetailsError({
      detail: "Requested plan is missing Stripe price mapping.",
      status: 409,
      title: "Conflict"
    });
  }

  const stripe = input.stripeClient ?? createStripeClient(input.config);
  const customerId = await resolveCustomerForCheckout({
    config: input.config,
    organizationReference: input.organizationReference
  });
  const locale =
    normalizeStripeLocale(input.locale) ??
    normalizeStripeLocale(readOrganizationSetting(organization.settings, "locale"));
  const countryCode =
    input.countryCode?.trim().toUpperCase() ??
    readOrganizationSetting(organization.settings, "countryCode")?.toUpperCase() ??
    null;

  if (countryCode && /^[A-Z]{2}$/.test(countryCode)) {
    await stripe.customers.update(customerId, {
      address: {
        country: countryCode
      }
    });
  }

  const session = await stripe.checkout.sessions.create({
    automatic_tax: {
      enabled: true
    },
    billing_address_collection: "auto",
    cancel_url: input.config.STRIPE_CANCEL_URL,
    customer: customerId,
    customer_update: {
      address: "auto",
      name: "auto"
    },
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1
      }
    ],
    ...(locale ? { locale } : {}),
    metadata: {
      countryCode: countryCode ?? "",
      organizationId: organization.id,
      planId: plan.id
    },
    mode: "subscription",
    subscription_data: {
      metadata: {
        organizationId: organization.id,
        planId: plan.id,
        tenantId: organization.tenantId
      },
      proration_behavior: "create_prorations"
    },
    success_url: `${input.config.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`
  });

  if (!session.url) {
    throw new ProblemDetailsError({
      detail: "Stripe did not return a checkout URL.",
      status: 502,
      title: "Bad Gateway"
    });
  }

  logger.info(
    {
      checkoutSessionId: session.id,
      countryCode,
      event: "billing.checkout.session.created",
      locale: locale ?? null,
      organizationId: organization.id,
      planId: plan.id,
      stripeCustomerId: customerId,
      tenantId: organization.tenantId
    },
    "Created Stripe checkout session"
  );

  return {
    id: session.id,
    url: session.url
  };
}

export async function createCustomerPortalSessionForOrganization(input: {
  config: ApiConfig;
  organizationReference: string;
  stripeClient?: Stripe;
}): Promise<{ url: string }> {
  const organization = await findOrganizationByReference(input.organizationReference);

  if (!organization?.stripeCustomerId) {
    throw new ProblemDetailsError({
      detail: "Stripe customer is not configured for this organization.",
      status: 409,
      title: "Conflict"
    });
  }

  const stripe = input.stripeClient ?? createStripeClient(input.config);
  const portal = await stripe.billingPortal.sessions.create({
    customer: organization.stripeCustomerId,
    return_url: input.config.STRIPE_PORTAL_RETURN_URL
  });

  logger.info(
    {
      event: "billing.portal.session.created",
      organizationId: organization.id,
      stripeCustomerId: organization.stripeCustomerId,
      tenantId: organization.tenantId
    },
    "Created Stripe customer portal session"
  );

  return {
    url: portal.url
  };
}

export async function listActivePlans() {
  return prisma.plan.findMany({
    orderBy: {
      monthlyPriceCents: "asc"
    },
    where: {
      active: true
    }
  });
}

export async function listInvoicesForOrganization(input: {
  cursor?: string;
  organizationReference: string;
  take: number;
}) {
  const organization = await findOrganizationByReference(input.organizationReference);

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found while listing invoices.",
      status: 404,
      title: "Not Found"
    });
  }

  const rows = await prisma.invoice.findMany({
    ...(input.cursor
      ? {
          cursor: {
            id: input.cursor
          },
          skip: 1
        }
      : {}),
    orderBy: {
      createdAt: "desc"
    },
    take: input.take + 1,
    where: {
      organizationId: organization.id
    }
  });

  return {
    items: rows.slice(0, input.take),
    nextCursor: rows.length > input.take ? rows[input.take - 1]?.id ?? null : null
  };
}

export async function listUsageForOrganization(organizationReference: string) {
  const organization = await findOrganizationByReference(organizationReference);

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found while listing usage.",
      status: 404,
      title: "Not Found"
    });
  }

  const usageRows = await prisma.usageRecord.findMany({
    orderBy: {
      occurredAt: "desc"
    },
    take: 300,
    where: {
      organizationId: organization.id
    }
  });
  const byMetric = new Map<string, number>();

  for (const row of usageRows) {
    byMetric.set(row.metric, (byMetric.get(row.metric) ?? 0) + row.quantity);
  }

  return {
    byMetric: Array.from(byMetric.entries()).map(([metric, quantity]) => ({
      metric,
      quantity
    })),
    items: usageRows
  };
}

export async function cancelBillingForOrganization(input: {
  config: ApiConfig;
  organizationReference: string;
}): Promise<{ canceled: boolean; stripeSubscriptionId: string | null }> {
  const organization = await prisma.organization.findFirst({
    include: {
      subscriptions: {
        orderBy: {
          updatedAt: "desc"
        },
        take: 1
      }
    },
    where: {
      OR: [{ id: input.organizationReference }, { tenantId: input.organizationReference }]
    }
  });

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found for billing cancellation.",
      status: 404,
      title: "Not Found"
    });
  }

  const subscription = organization.subscriptions[0] ?? null;

  if (!subscription?.stripeSubscriptionId) {
    return {
      canceled: false,
      stripeSubscriptionId: null
    };
  }

  const stripe = createStripeClient(input.config);
  await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

  await prisma.subscription.update({
    data: {
      canceledAt: new Date(),
      status: SubscriptionStatus.canceled
    },
    where: {
      id: subscription.id
    }
  });

  logger.info(
    {
      event: "billing.subscription.canceled",
      organizationId: organization.id,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      subscriptionId: subscription.id,
      tenantId: organization.tenantId
    },
    "Canceled organization subscription"
  );

  return {
    canceled: true,
    stripeSubscriptionId: subscription.stripeSubscriptionId
  };
}
