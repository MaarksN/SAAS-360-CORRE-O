import {
  AgentStatus,
  InviteStatus,
  MembershipStatus,
  QuotaResourceType,
  SessionStatus,
  SubscriptionStatus,
  InvoiceStatus
} from "@prisma/client";
import { createHash } from "node:crypto";

import { createPrismaClient } from "../../src/client.js";
import { buildTenantWorkflows } from "./data.js";
import type { SeededPlanMap, TenantSeed } from "./types.js";
import { createWorkflowWithGraph } from "./workflows.js";

const prisma = createPrismaClient();

export async function disconnectTenantClient(): Promise<void> {
  await prisma.$disconnect();
}

function unlimitedToLargeNumber(value: unknown): number {
  if (typeof value !== "number") {
    return 0;
  }

  return value < 0 ? 1_000_000 : value;
}

async function upsertOrganization(seed: TenantSeed, planId: string) {
  const stripeCustomerId = `cus_${seed.slug.replace(/-/g, "_")}`;
  return prisma.organization.upsert({
    where: { stripeCustomerId },
    update: {
      name: seed.name,
      planId,
      settings: { locale: "pt-BR", timezone: "America/Sao_Paulo" },
      slug: seed.slug
    },
    create: {
      name: seed.name,
      planId,
      settings: { locale: "pt-BR", timezone: "America/Sao_Paulo" },
      slug: seed.slug,
      stripeCustomerId
    }
  });
}

async function upsertUsers(seed: TenantSeed) {
  const passwordHash = createHash("sha256").update("password123").digest("hex");
  return Promise.all(
    seed.members.map((member) =>
      prisma.user.upsert({
        where: { email: member.email },
        update: { name: member.name, passwordHash },
        create: { email: member.email, name: member.name, passwordHash }
      })
    )
  );
}

async function seedMembershipsAndSessions(input: {
  organizationId: string;
  seed: TenantSeed;
  tenantId: string;
  users: Awaited<ReturnType<typeof upsertUsers>>;
}): Promise<void> {
  await Promise.all(
    input.users.map((user, index) =>
      prisma.membership.upsert({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: user.id
          }
        },
        update: {
          role: input.seed.members[index]?.role ?? "MEMBER",
          status: MembershipStatus.ACTIVE
        },
        create: {
          organizationId: input.organizationId,
          role: input.seed.members[index]?.role ?? "MEMBER",
          status: MembershipStatus.ACTIVE,
          tenantId: input.tenantId,
          userId: user.id
        }
      })
    )
  );

  await Promise.all(
    input.users.map((user, index) =>
      prisma.session.create({
        data: {
          csrfToken: `${input.seed.slug}-${index + 1}-csrf`,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          organizationId: input.organizationId,
          refreshExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
          refreshTokenHash: createHash("sha256")
            .update(`${input.seed.slug}-${index + 1}-refresh`)
            .digest("hex"),
          status: SessionStatus.ACTIVE,
          tenantId: input.tenantId,
          token: `${input.seed.slug}-${index + 1}-session`,
          userId: user.id
        }
      })
    )
  );
}

async function seedBillingRecords(input: {
  organizationId: string;
  planCode: string;
  seed: TenantSeed;
  subscriptionId: string;
  tenantId: string;
}): Promise<void> {
  const pmId = `pm_${input.seed.slug.replace(/-/g, "_")}`;
  const invoiceId = `in_${input.seed.slug.replace(/-/g, "_")}_001`;

  if (await prisma.paymentMethod.count({ where: { stripePaymentMethodId: pmId } }) === 0) {
    await prisma.paymentMethod.create({
      data: {
        brand: "visa",
        expMonth: 12,
        expYear: 2030,
        isDefault: true,
        last4: "4242",
        organizationId: input.organizationId,
        stripePaymentMethodId: pmId,
        tenantId: input.tenantId
      }
    });
  }

  if (await prisma.invoice.count({ where: { stripeInvoiceId: invoiceId } }) === 0) {
    await prisma.invoice.create({
      data: {
        amountDueCents: input.planCode === "enterprise" ? 0 : 14900,
        amountPaidCents: input.planCode === "enterprise" ? 0 : 14900,
        currency: "usd",
        hostedInvoiceUrl: `https://billing.stripe.com/invoice/${input.seed.slug}/latest`,
        invoicePdfUrl: `https://pay.stripe.com/invoice/${input.seed.slug}/latest.pdf`,
        organizationId: input.organizationId,
        periodEnd: new Date("2026-03-31T23:59:59.000Z"),
        periodStart: new Date("2026-03-01T00:00:00.000Z"),
        status: InvoiceStatus.paid,
        stripeInvoiceId: invoiceId,
        subscriptionId: input.subscriptionId,
        tenantId: input.tenantId
      }
    });
  }

  const billingEventId = `evt_${input.seed.slug.replace(/-/g, "_")}_bootstrap`;
  if (await prisma.billingEvent.count({ where: { stripeEventId: billingEventId } }) === 0) {
    await prisma.billingEvent.create({
      data: {
        organizationId: input.organizationId,
        payload: { note: "Seeded baseline billing event", status: "processed" },
        stripeEventId: billingEventId,
        tenantId: input.tenantId,
        type: "seed.subscription.created"
      }
    });
  }
}

async function seedUsageAndQuota(input: {
  organizationId: string;
  planLimits: Record<string, unknown>;
  seed: TenantSeed;
  subscriptionId: string;
  tenantId: string;
}): Promise<void> {
  await Promise.all(
    [
      { metric: "tokens.input", quantity: 122_000 },
      { metric: "tokens.output", quantity: 88_400 },
      { metric: "workflow.runs", quantity: 46 }
    ].map((usage, index) =>
      prisma.usageRecord.create({
        data: {
          eventId: `${input.seed.slug}-usage-${index + 1}`,
          metadata: { source: "seed-script" },
          metric: usage.metric,
          organizationId: input.organizationId,
          quantity: usage.quantity,
          subscriptionId: input.subscriptionId,
          tenantId: input.tenantId
        }
      })
    )
  );

  const agentsLimit = unlimitedToLargeNumber(input.planLimits.agents);
  const workflowsLimit = unlimitedToLargeNumber(input.planLimits.workflows);
  const tokensLimit = unlimitedToLargeNumber(input.planLimits.monthlyTokens);

  await Promise.all(
    [
      { limit: Math.max(5_000, tokensLimit), resourceType: QuotaResourceType.API_REQUESTS },
      { limit: Math.max(1_000, Math.floor(tokensLimit / 4)), resourceType: QuotaResourceType.AI_PROMPTS },
      { limit: Math.max(2_500, workflowsLimit * 15), resourceType: QuotaResourceType.EMAILS_SENT },
      { limit: Math.max(100, agentsLimit), resourceType: QuotaResourceType.STORAGE_GB },
      { limit: Math.max(10_000, workflowsLimit * 40), resourceType: QuotaResourceType.WORKFLOW_RUNS }
    ].map((quota, index) =>
      prisma.quotaUsage.create({
        data: {
          count: index * 10,
          limit: quota.limit,
          period: "MONTHLY-2026-03",
          resetAt: new Date("2026-04-01T00:00:00.000Z"),
          resourceType: quota.resourceType,
          tenantId: input.tenantId
        }
      })
    )
  );
}

async function seedInviteAndSecret(input: {
  organizationId: string;
  seed: TenantSeed;
  tenantId: string;
  userId: string | null;
}): Promise<void> {
  const inviteToken = `${input.seed.slug}-invite-token`;
  if (await prisma.invite.count({ where: { token: inviteToken } }) === 0) {
    await prisma.invite.create({
      data: {
        email: `invite.${input.seed.slug}@birthub.local`,
        expiresAt: new Date("2026-03-20T00:00:00.000Z"),
        invitedByUserId: input.userId,
        organizationId: input.organizationId,
        role: "MEMBER",
        status: InviteStatus.PENDING,
        tenantId: input.tenantId,
        token: inviteToken
      }
    });
  }

  const secretHash = createHash("sha256").update(`${input.tenantId}-job-secret`).digest("hex");
  if (await prisma.jobSigningSecret.count({ where: { tenantId: input.tenantId } }) === 0) {
    await prisma.jobSigningSecret.create({
      data: {
        organizationId: input.organizationId,
        secret: secretHash,
        tenantId: input.tenantId
      }
    });
  }
}

export async function createTenant(seed: TenantSeed, planMap: SeededPlanMap): Promise<void> {
  const selectedPlan = planMap.get(seed.planCode);
  if (!selectedPlan) {
    throw new Error(`Plan '${seed.planCode}' was not seeded.`);
  }

  const organization = await upsertOrganization(seed, selectedPlan.id);
  const users = await upsertUsers(seed);
  await seedMembershipsAndSessions({
    organizationId: organization.id,
    seed,
    tenantId: organization.tenantId,
    users
  });

  await Promise.all(
    seed.agents.map((agentName, index) =>
      prisma.agent.create({
        data: {
          config: { channel: index === 0 ? "concierge" : index === 1 ? "growth" : "retention" },
          name: agentName,
          organizationId: organization.id,
          status: AgentStatus.ACTIVE,
          tenantId: organization.tenantId
        }
      })
    )
  );

  await Promise.all(
    Array.from({ length: 3 }, (_, index) =>
      prisma.customer.create({
        data: {
          email: `customer.${index + 1}.${seed.slug}@birthub.local`,
          metadata: { lifecycle: index === 0 ? "new" : index === 1 ? "active" : "renewal" },
          name: `${seed.name} Customer ${index + 1}`,
          organizationId: organization.id,
          status: index === 2 ? "at-risk" : "active",
          tenantId: organization.tenantId
        }
      })
    )
  );

  const workflows = await Promise.all(
    buildTenantWorkflows(organization.tenantId).map((workflow) =>
      createWorkflowWithGraph({ organizationId: organization.id, tenantId: organization.tenantId, workflow })
    )
  );

  await Promise.all(
    workflows.map(async (workflow) => {
      const auditCount = await prisma.auditLog.count({ where: { action: "workflow.seeded", entityId: workflow.id } });
      if (auditCount === 0) {
        await prisma.auditLog.create({
          data: {
            action: "workflow.seeded",
            actorId: users[0]?.id ?? null,
            diff: { status: workflow.status },
            entityId: workflow.id,
            entityType: "workflow",
            ip: "127.0.0.1",
            tenantId: organization.tenantId,
            userAgent: "seed-script/1.0"
          }
        });
      }
    })
  );

  const stripeSubscriptionId = `sub_${seed.slug.replace(/-/g, "_")}`;
  const subscription =
    (await prisma.subscription.findFirst({ where: { stripeSubscriptionId } })) ??
    (await prisma.subscription.create({
      data: {
        currentPeriodEnd: new Date("2026-04-01T00:00:00.000Z"),
        organizationId: organization.id,
        planId: selectedPlan.id,
        status: SubscriptionStatus.active,
        stripeCustomerId: `cus_${seed.slug.replace(/-/g, "_")}`,
        stripeSubscriptionId,
        tenantId: organization.tenantId
      }
    }));

  await seedBillingRecords({
    organizationId: organization.id,
    planCode: seed.planCode,
    seed,
    subscriptionId: subscription.id,
    tenantId: organization.tenantId
  });
  await seedUsageAndQuota({
    organizationId: organization.id,
    planLimits: selectedPlan.limits,
    seed,
    subscriptionId: subscription.id,
    tenantId: organization.tenantId
  });
  await seedInviteAndSecret({
    organizationId: organization.id,
    seed,
    tenantId: organization.tenantId,
    userId: users[0]?.id ?? null
  });
}
