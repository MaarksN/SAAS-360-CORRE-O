import { createHash } from "node:crypto";

import { Prisma, PrismaClient, Role } from "@prisma/client";

export type SeedPlan = {
  code: string;
  currency: string;
  description: string;
  limits: Record<string, unknown>;
  monthlyPriceCents: number;
  name: string;
  stripePriceId: string;
  stripeProductId: string;
  yearlyPriceCents: number;
};

export type TenantSeed = {
  agents: string[];
  members: Array<{ email: string; name: string; role: Role }>;
  name: string;
  planCode: string;
  slug: string;
};

export type PlanMap = Map<string, { id: string; limits: Record<string, unknown> }>;

export const plans: SeedPlan[] = [
  {
    code: "starter",
    currency: "usd",
    description: "Plano de entrada para times pequenos.",
    limits: {
      agents: 5,
      aiPrompts: 5_000,
      apiRequests: 5_000,
      emails: 2_500,
      features: {
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
  },
  {
    code: "pro",
    currency: "usd",
    description: "Plano para operacoes com automacoes avancadas.",
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
  {
    code: "enterprise",
    currency: "usd",
    description: "Plano enterprise com limites expandidos.",
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
  }
];

export const developmentTenants: TenantSeed[] = [
  {
    agents: ["Alpha Concierge", "Alpha Revenue Scout", "Alpha Retention Radar"],
    members: [
      { email: "owner.alpha@birthub.local", name: "Alpha Owner", role: Role.OWNER },
      { email: "admin.alpha@birthub.local", name: "Alpha Admin", role: Role.ADMIN },
      { email: "member.alpha@birthub.local", name: "Alpha Member", role: Role.MEMBER }
    ],
    name: "BirthHub Alpha",
    planCode: "pro",
    slug: "birthhub-alpha"
  },
  {
    agents: ["Beta Concierge", "Beta Revenue Scout", "Beta Retention Radar"],
    members: [
      { email: "owner.beta@birthub.local", name: "Beta Owner", role: Role.OWNER },
      { email: "admin.beta@birthub.local", name: "Beta Admin", role: Role.ADMIN },
      { email: "member.beta@birthub.local", name: "Beta Member", role: Role.MEMBER }
    ],
    name: "BirthHub Beta",
    planCode: "starter",
    slug: "birthhub-beta"
  }
];

export const smokeTenants: TenantSeed[] = [
  {
    agents: ["Smoke Concierge"],
    members: [
      { email: "owner.smoke@birthub.local", name: "Smoke Owner", role: Role.OWNER },
      { email: "member.smoke@birthub.local", name: "Smoke Member", role: Role.MEMBER }
    ],
    name: "BirthHub Smoke",
    planCode: "starter",
    slug: "birthhub-smoke"
  }
];

export function asJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export function passwordHash(seed: string): string {
  return createHash("sha256").update(seed).digest("hex");
}

function anonymizeLabel(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 8).toUpperCase();
}

export function buildStagingTenants(): TenantSeed[] {
  return developmentTenants.map((tenant) => ({
    ...tenant,
    members: tenant.members.map((member, index) => ({
      ...member,
      email: `anon.${anonymizeLabel(member.email).toLowerCase()}@staging.birthub.local`,
      name: `Anon User ${index + 1}`
    })),
    name: `Tenant ${anonymizeLabel(tenant.name)}`,
    slug: `staging-${anonymizeLabel(tenant.slug).toLowerCase()}`
  }));
}

export async function seedPlanCatalog(prisma: PrismaClient): Promise<PlanMap> {
  const seeded = new Map<string, { id: string; limits: Record<string, unknown> }>();

  for (const plan of plans) {
    const record = await prisma.plan.upsert({
      create: {
        code: plan.code,
        currency: plan.currency,
        description: plan.description,
        limits: plan.limits as Prisma.InputJsonValue,
        monthlyPriceCents: plan.monthlyPriceCents,
        name: plan.name,
        stripePriceId: plan.stripePriceId,
        stripeProductId: plan.stripeProductId,
        yearlyPriceCents: plan.yearlyPriceCents
      },
      update: {
        active: true,
        currency: plan.currency,
        description: plan.description,
        limits: plan.limits as Prisma.InputJsonValue,
        monthlyPriceCents: plan.monthlyPriceCents,
        name: plan.name,
        stripePriceId: plan.stripePriceId,
        stripeProductId: plan.stripeProductId,
        yearlyPriceCents: plan.yearlyPriceCents
      },
      where: {
        code: plan.code
      }
    });

    seeded.set(plan.code, { id: record.id, limits: plan.limits });
  }

  return seeded;
}

export async function ensureOrganization(
  prisma: PrismaClient,
  tenant: TenantSeed,
  planMap: PlanMap
) {
  const selectedPlan = planMap.get(tenant.planCode);

  if (!selectedPlan) {
    throw new Error(`Plan '${tenant.planCode}' was not seeded.`);
  }

  return prisma.organization.upsert({
    create: {
      name: tenant.name,
      planId: selectedPlan.id,
      settings: {
        locale: "pt-BR",
        timezone: "America/Sao_Paulo"
      },
      slug: tenant.slug,
      stripeCustomerId: `cus_${tenant.slug.replace(/-/g, "_")}`
    },
    update: {
      name: tenant.name,
      planId: selectedPlan.id,
      settings: {
        locale: "pt-BR",
        timezone: "America/Sao_Paulo"
      }
    },
    where: {
      slug: tenant.slug
    }
  });
}
