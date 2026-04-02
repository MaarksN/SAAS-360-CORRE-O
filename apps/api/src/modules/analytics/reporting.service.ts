import { Prisma, SubscriptionStatus, prisma } from "@birthub/database";

import type { DateRange } from "./analytics.types.js";
import { resolveDateRange } from "./analytics.utils.js";

export async function getExecutiveMetrics() {
  const subscriptions = await prisma.subscription.findMany({
    include: {
      plan: true
    }
  });
  const activeStatuses = new Set<SubscriptionStatus>([
    SubscriptionStatus.active,
    SubscriptionStatus.past_due,
    SubscriptionStatus.paused
  ]);
  const paying = subscriptions.filter((subscription) => activeStatuses.has(subscription.status));
  const mrr = paying.reduce((total, subscription) => total + subscription.plan.monthlyPriceCents, 0);
  const cancelled = subscriptions.filter(
    (subscription) => subscription.status === SubscriptionStatus.canceled
  ).length;
  const trial = subscriptions.filter((subscription) => subscription.status === SubscriptionStatus.trial).length;
  const churnRate = subscriptions.length > 0 ? cancelled / subscriptions.length : 0;
  const trialConversionRate =
    trial + paying.length > 0 ? paying.length / (trial + paying.length) : 0;

  return {
    arrCents: mrr * 12,
    churnRate,
    mrrCents: mrr,
    trialConversionRate
  };
}

export async function getCohortMetrics() {
  const rows = await prisma.$queryRaw<
    Array<{
      cohort_month: Date;
      cohort_size: bigint;
      retained_m1: bigint;
      retained_m2: bigint;
      retained_m3: bigint;
    }>
  >(Prisma.sql`
    SELECT
      date_trunc('month', o."createdAt") AS cohort_month,
      COUNT(*) AS cohort_size,
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1
          FROM "workflow_executions" we
          WHERE we."tenantId" = o."tenantId"
            AND we."createdAt" >= date_trunc('month', o."createdAt") + interval '1 month'
            AND we."createdAt" < date_trunc('month', o."createdAt") + interval '2 month'
        )
      ) AS retained_m1,
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1
          FROM "workflow_executions" we
          WHERE we."tenantId" = o."tenantId"
            AND we."createdAt" >= date_trunc('month', o."createdAt") + interval '2 month'
            AND we."createdAt" < date_trunc('month', o."createdAt") + interval '3 month'
        )
      ) AS retained_m2,
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1
          FROM "workflow_executions" we
          WHERE we."tenantId" = o."tenantId"
            AND we."createdAt" >= date_trunc('month', o."createdAt") + interval '3 month'
            AND we."createdAt" < date_trunc('month', o."createdAt") + interval '4 month'
        )
      ) AS retained_m3
    FROM "organizations" o
    GROUP BY cohort_month
    ORDER BY cohort_month ASC
  `);

  return rows.map((row) => ({
    cohortMonth: row.cohort_month.toISOString(),
    cohortSize: Number(row.cohort_size),
    retainedM1: Number(row.retained_m1),
    retainedM2: Number(row.retained_m2),
    retainedM3: Number(row.retained_m3)
  }));
}

export async function exportBillingCsv(input: Partial<DateRange>) {
  const { from, to } = resolveDateRange(input);
  const invoices = await prisma.invoice.findMany({
    orderBy: {
      createdAt: "asc"
    },
    where: {
      createdAt: {
        gte: from,
        lte: to
      },
      status: "paid"
    }
  });
  const headers = [
    "invoice_id",
    "tenant_id",
    "organization_id",
    "status",
    "amount_paid_cents",
    "currency",
    "created_at",
    "invoice_pdf_url"
  ];
  const rows = invoices.map((invoice) =>
    [
      invoice.id,
      invoice.tenantId,
      invoice.organizationId,
      invoice.status,
      invoice.amountPaidCents,
      invoice.currency,
      invoice.createdAt.toISOString(),
      invoice.invoicePdfUrl ?? ""
    ]
      .map((value) => JSON.stringify(String(value)))
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

export async function getCsRiskAccounts() {
  const organizations = await prisma.organization.findMany({
    include: {
      subscriptions: {
        include: {
          plan: true
        },
        orderBy: {
          updatedAt: "desc"
        },
        take: 1
      },
      tenantActivityWindows: {
        orderBy: {
          computedAt: "desc"
        },
        where: {
          windowDays: 30
        }
      }
    },
    orderBy: [
      {
        healthScore: "asc"
      },
      {
        updatedAt: "desc"
      }
    ]
  });

  return organizations.map((organization) => {
    const subscription = organization.subscriptions[0] ?? null;
    const activity = organization.tenantActivityWindows[0] ?? null;
    const arrCents = (subscription?.plan.monthlyPriceCents ?? 0) * 12;

    return {
      activeUsers30d: activity?.activeUsers ?? 0,
      agentRuns30d: activity?.agentRuns ?? 0,
      arrCents,
      billingErrors30d: activity?.billingErrors ?? 0,
      healthScore: organization.healthScore,
      organizationId: organization.id,
      slug: organization.slug,
      status: subscription?.status ?? null,
      tenantId: organization.tenantId
    };
  });
}

export async function getQualityReport() {
  const negativeFeedback = await prisma.agentFeedback.findMany({
    include: {
      execution: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 100,
    where: {
      rating: -1
    }
  });

  return negativeFeedback.map((item) => ({
    agentId: item.agentId,
    createdAt: item.createdAt.toISOString(),
    errorMessage: item.execution.errorMessage,
    executionId: item.executionId,
    expectedOutput: item.expectedOutput,
    notes: item.notes,
    rating: item.rating,
    status: item.execution.status,
    tenantId: item.tenantId
  }));
}

export async function getGlobalAgentPerformance() {
  const executions = await prisma.agentExecution.findMany({
    orderBy: {
      createdAt: "desc"
    },
    select: {
      agentId: true,
      status: true
    },
    take: 5_000
  });

  const grouped = new Map<
    string,
    {
      failed: number;
      total: number;
    }
  >();

  for (const execution of executions) {
    const current = grouped.get(execution.agentId) ?? {
      failed: 0,
      total: 0
    };
    current.total += 1;

    if (execution.status === "FAILED") {
      current.failed += 1;
    }

    grouped.set(execution.agentId, current);
  }

  const items = Array.from(grouped.entries()).map(([agentId, value]) => ({
    agentId,
    failed: value.failed,
    failureRate: value.total > 0 ? value.failed / value.total : 0,
    total: value.total
  }));

  return {
    mostExecuted: items.slice().sort((left, right) => right.total - left.total).slice(0, 10),
    mostFailed: items.slice().sort((left, right) => right.failed - left.failed).slice(0, 10)
  };
}
