import {
  Prisma,
  SubscriptionStatus,
  prisma
} from "@birthub/database";

import { ProblemDetailsError } from "../../lib/problem-details.js";

export type DatabaseClient = Prisma.TransactionClient | typeof prisma;

const PLAN_CODE_ALIASES: Record<string, string> = {
  professional: "pro"
};

const DEFAULT_PLANS: Record<
  string,
  {
    description: string;
    limits: Record<string, unknown>;
    monthlyPriceCents: number;
    name: string;
    stripePriceId: string;
    stripeProductId: string;
    yearlyPriceCents: number;
  }
> = {
  enterprise: {
    description: "Plano enterprise com limites ilimitados e suporte prioritario.",
    limits: {
      agents: -1,
      aiPrompts: -1,
      apiRequests: -1,
      emails: -1,
      features: {
        advancedAnalytics: true,
        agents: true,
        customerPortal: true,
        prioritySupport: true,
        workflows: true
      },
      monthlyTokens: -1,
      storageGb: -1,
      workflows: -1
    },
    monthlyPriceCents: 49900,
    name: "Enterprise",
    stripePriceId: "price_enterprise_monthly",
    stripeProductId: "prod_enterprise",
    yearlyPriceCents: 479040
  },
  pro: {
    description: "Plano para operacao em escala com automacoes avancadas.",
    limits: {
      agents: 25,
      aiPrompts: 25_000,
      apiRequests: 25_000,
      emails: 10_000,
      features: {
        advancedAnalytics: true,
        agents: true,
        customerPortal: true,
        workflows: true
      },
      monthlyTokens: 2_500_000,
      storageGb: 500,
      workflows: 250
    },
    monthlyPriceCents: 14900,
    name: "Pro",
    stripePriceId: "price_pro_monthly",
    stripeProductId: "prod_pro",
    yearlyPriceCents: 143040
  },
  starter: {
    description: "Plano de entrada para times pequenos.",
    limits: {
      agents: 5,
      aiPrompts: 5_000,
      apiRequests: 5_000,
      emails: 2_500,
      features: {
        advancedAnalytics: false,
        agents: true,
        customerPortal: true,
        workflows: true
      },
      monthlyTokens: 250_000,
      storageGb: 100,
      workflows: 30
    },
    monthlyPriceCents: 4900,
    name: "Starter",
    stripePriceId: "price_starter_monthly",
    stripeProductId: "prod_starter",
    yearlyPriceCents: 47040
  }
};

export interface BillingSnapshot {
  creditBalanceCents: number;
  currentPeriodEnd: Date | null;
  gracePeriodEndsAt: Date | null;
  hardLocked: boolean;
  isPaid: boolean;
  isWithinGracePeriod: boolean;
  organizationId: string;
  plan: {
    code: string;
    id: string;
    limits: Prisma.JsonValue;
    name: string;
  };
  secondsUntilHardLock: number | null;
  status: SubscriptionStatus | null;
  stripeCustomerId: string | null;
  subscriptionId: string | null;
  tenantId: string;
}

export interface StripeBillingEventContext {
  organizationId?: string;
  tenantId?: string;
}

export function normalizePlanCode(code: string): string {
  const normalized = code.trim().toLowerCase();
  return PLAN_CODE_ALIASES[normalized] ?? normalized;
}

export async function findOrganizationByReference(
  organizationReference: string,
  client: DatabaseClient = prisma
) {
  return client.organization.findFirst({
    where: {
      OR: [{ id: organizationReference }, { tenantId: organizationReference }]
    }
  });
}

export async function ensurePlanByCode(
  code: string,
  client: DatabaseClient = prisma
) {
  const normalized = normalizePlanCode(code);
  const plan = await client.plan.findUnique({
    where: {
      code: normalized
    }
  });

  if (plan) {
    return plan;
  }

  const defaults = DEFAULT_PLANS[normalized] ?? DEFAULT_PLANS.starter;

  if (!defaults) {
    throw new ProblemDetailsError({
      detail: `No default configuration found for plan code '${normalized}'.`,
      status: 500,
      title: "Internal Server Error"
    });
  }

  return client.plan.create({
    data: {
      code: normalized,
      description: defaults.description,
      limits: defaults.limits as Prisma.InputJsonValue,
      monthlyPriceCents: defaults.monthlyPriceCents,
      name: defaults.name,
      stripePriceId: defaults.stripePriceId,
      stripeProductId: defaults.stripeProductId,
      yearlyPriceCents: defaults.yearlyPriceCents
    }
  });
}
