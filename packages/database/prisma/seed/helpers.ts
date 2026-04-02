import { Prisma } from "@prisma/client";

import { createPrismaClient } from "../../src/client.js";

import { plans } from "./data.js";
import type { PlanSeed, SeededPlanMap } from "./types.js";

const prisma = createPrismaClient();

function buildPlanPayload(plan: PlanSeed) {
  return {
    code: plan.code,
    currency: plan.currency,
    description: plan.description,
    limits: plan.limits as Prisma.InputJsonValue,
    monthlyPriceCents: plan.monthlyPriceCents,
    name: plan.name,
    stripePriceId: plan.stripePriceId,
    stripeProductId: plan.stripeProductId,
    yearlyPriceCents: plan.yearlyPriceCents
  };
}

export async function disconnectSeedClient(): Promise<void> {
  await prisma.$disconnect();
}

export async function wipeDatabase(): Promise<void> {
  await prisma.jobSigningSecret.deleteMany();
  await prisma.loginAlert.deleteMany();
  await prisma.mfaChallenge.deleteMany();
  await prisma.mfaRecoveryCode.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.billingEvent.deleteMany();
  await prisma.usageRecord.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.quotaUsage.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.stepResult.deleteMany();
  await prisma.workflowExecution.deleteMany();
  await prisma.workflowTransition.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.session.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.plan.deleteMany();
}

export async function seedPlans(): Promise<SeededPlanMap> {
  const seeded = new Map<string, { id: string; limits: Record<string, unknown> }>();

  for (const plan of plans) {
    const record = await prisma.plan.upsert({
      create: buildPlanPayload(plan),
      update: {
        ...buildPlanPayload(plan),
        active: true
      },
      where: { code: plan.code }
    });

    seeded.set(plan.code, { id: record.id, limits: plan.limits });
  }

  return seeded;
}
