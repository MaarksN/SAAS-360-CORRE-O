import {
  InvoiceStatus,
  NotificationType,
  PrismaClient,
  QuotaResourceType,
  SubscriptionStatus
} from "@prisma/client";

import { passwordHash, type PlanMap, type TenantSeed } from "./shared-foundation.js";

export async function ensureBilling(
  prisma: PrismaClient,
  tenant: TenantSeed,
  organizationId: string,
  tenantId: string,
  planMap: PlanMap
) {
  const selectedPlan = planMap.get(tenant.planCode);

  if (!selectedPlan) {
    throw new Error(`Plan '${tenant.planCode}' was not seeded.`);
  }

  for (const [index, status] of ["active", "active", "at-risk"].entries()) {
    await prisma.customer.upsert({
      create: {
        email: `customer.${index + 1}.${tenant.slug}@birthub.local`,
        metadata: {
          source: "seed",
          tier: index === 0 ? "new" : index === 1 ? "growth" : "renewal"
        },
        name: `${tenant.name} Customer ${index + 1}`,
        organizationId,
        status,
        tenantId
      },
      update: {
        metadata: {
          source: "seed",
          tier: index === 0 ? "new" : index === 1 ? "growth" : "renewal"
        },
        name: `${tenant.name} Customer ${index + 1}`,
        organizationId,
        status
      },
      where: {
        tenantId_email: {
          email: `customer.${index + 1}.${tenant.slug}@birthub.local`,
          tenantId
        }
      }
    });
  }

  const subscription = await prisma.subscription.upsert({
    create: {
      currentPeriodEnd: new Date("2026-12-31T00:00:00.000Z"),
      organizationId,
      planId: selectedPlan.id,
      status: SubscriptionStatus.active,
      stripeCustomerId: `cus_${tenant.slug.replace(/-/g, "_")}`,
      stripeSubscriptionId: `sub_${tenant.slug.replace(/-/g, "_")}`,
      tenantId
    },
    update: {
      currentPeriodEnd: new Date("2026-12-31T00:00:00.000Z"),
      planId: selectedPlan.id,
      status: SubscriptionStatus.active,
      stripeCustomerId: `cus_${tenant.slug.replace(/-/g, "_")}`,
      tenantId
    },
    where: {
      organizationId
    }
  });

  await prisma.paymentMethod.upsert({
    create: {
      brand: "visa",
      expMonth: 12,
      expYear: 2030,
      isDefault: true,
      last4: "4242",
      organizationId,
      stripePaymentMethodId: `pm_${tenant.slug.replace(/-/g, "_")}`,
      tenantId
    },
    update: {
      brand: "visa",
      expMonth: 12,
      expYear: 2030,
      isDefault: true,
      last4: "4242",
      organizationId,
      tenantId
    },
    where: {
      stripePaymentMethodId: `pm_${tenant.slug.replace(/-/g, "_")}`
    }
  });

  await prisma.invoice.upsert({
    create: {
      amountDueCents: tenant.planCode === "enterprise" ? 0 : 14900,
      amountPaidCents: tenant.planCode === "enterprise" ? 0 : 14900,
      currency: "usd",
      hostedInvoiceUrl: `https://billing.stripe.com/invoice/${tenant.slug}/latest`,
      invoicePdfUrl: `https://pay.stripe.com/invoice/${tenant.slug}/latest.pdf`,
      organizationId,
      periodEnd: new Date("2026-12-31T23:59:59.000Z"),
      periodStart: new Date("2026-12-01T00:00:00.000Z"),
      status: InvoiceStatus.paid,
      stripeInvoiceId: `in_${tenant.slug.replace(/-/g, "_")}_001`,
      subscriptionId: subscription.id,
      tenantId
    },
    update: {
      amountDueCents: tenant.planCode === "enterprise" ? 0 : 14900,
      amountPaidCents: tenant.planCode === "enterprise" ? 0 : 14900,
      organizationId,
      status: InvoiceStatus.paid,
      subscriptionId: subscription.id,
      tenantId
    },
    where: {
      stripeInvoiceId: `in_${tenant.slug.replace(/-/g, "_")}_001`
    }
  });

  for (const [index, usage] of [
    { metric: "tokens.input", quantity: 122_000 },
    { metric: "tokens.output", quantity: 88_400 },
    { metric: "workflow.runs", quantity: 46 }
  ].entries()) {
    await prisma.usageRecord.upsert({
      create: {
        eventId: `${tenant.slug}-usage-${index + 1}`,
        metric: usage.metric,
        metadata: {
          source: "seed"
        },
        organizationId,
        quantity: usage.quantity,
        subscriptionId: subscription.id,
        tenantId
      },
      update: {
        metric: usage.metric,
        metadata: {
          source: "seed"
        },
        organizationId,
        quantity: usage.quantity,
        subscriptionId: subscription.id,
        tenantId
      },
      where: {
        eventId: `${tenant.slug}-usage-${index + 1}`
      }
    });
  }

  await prisma.billingEvent.upsert({
    create: {
      organizationId,
      payload: {
        seeded: true,
        tenant: tenant.slug
      },
      stripeEventId: `evt_${tenant.slug.replace(/-/g, "_")}_bootstrap`,
      tenantId,
      type: "seed.subscription.created"
    },
    update: {
      organizationId,
      payload: {
        seeded: true,
        tenant: tenant.slug
      },
      tenantId,
      type: "seed.subscription.created"
    },
    where: {
      stripeEventId: `evt_${tenant.slug.replace(/-/g, "_")}_bootstrap`
    }
  });

  for (const [index, quota] of [
    { count: 120, limit: 5_000, resourceType: QuotaResourceType.API_REQUESTS },
    { count: 60, limit: 2_500, resourceType: QuotaResourceType.AI_PROMPTS },
    { count: 80, limit: 4_000, resourceType: QuotaResourceType.EMAILS_SENT },
    { count: 12, limit: 100, resourceType: QuotaResourceType.STORAGE_GB },
    { count: 40, limit: 500, resourceType: QuotaResourceType.WORKFLOW_RUNS }
  ].entries()) {
    await prisma.quotaUsage.upsert({
      create: {
        count: quota.count,
        limit: quota.limit,
        period: "MONTHLY-2026-12",
        resetAt: new Date("2027-01-01T00:00:00.000Z"),
        resourceType: quota.resourceType,
        tenantId
      },
      update: {
        count: quota.count + index,
        limit: quota.limit,
        resetAt: new Date("2027-01-01T00:00:00.000Z")
      },
      where: {
        tenantId_resourceType_period: {
          period: "MONTHLY-2026-12",
          resourceType: quota.resourceType,
          tenantId
        }
      }
    });
  }
}

export async function ensureSupportArtifacts(
  prisma: PrismaClient,
  tenant: TenantSeed,
  organizationId: string,
  tenantId: string,
  ownerUserId?: string
) {
  await prisma.jobSigningSecret.upsert({
    create: {
      organizationId,
      secret: passwordHash(`${tenantId}-job-secret`),
      tenantId
    },
    update: {
      organizationId,
      secret: passwordHash(`${tenantId}-job-secret`)
    },
    where: {
      tenantId
    }
  });

  if (ownerUserId) {
    const existingAudit = await prisma.auditLog.findFirst({
      where: {
        action: "seed.bootstrap",
        entityId: organizationId,
        tenantId
      }
    });

    if (!existingAudit) {
      await prisma.auditLog.create({
        data: {
          action: "seed.bootstrap",
          actorId: ownerUserId,
          diff: {
            seeded: true
          },
          entityId: organizationId,
          entityType: "organization",
          tenantId,
          userAgent: "seed-script/2.0"
        }
      });
    }

    const existingNotification = await prisma.notification.findFirst({
      where: {
        content: `Seed bootstrap completed for ${tenant.slug}`,
        tenantId,
        userId: ownerUserId
      }
    });

    if (!existingNotification) {
      await prisma.notification.create({
        data: {
          content: `Seed bootstrap completed for ${tenant.slug}`,
          organizationId,
          tenantId,
          type: NotificationType.SUCCESS,
          userId: ownerUserId
        }
      });
    }
  }
}
