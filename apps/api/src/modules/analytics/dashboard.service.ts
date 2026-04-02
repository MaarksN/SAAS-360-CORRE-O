import { getApiConfig } from "@birthub/config";
import { SubscriptionStatus, prisma } from "@birthub/database";

import { agentMetricsService } from "../agents/metrics.service.js";
import { getInstalledAgentQueueStats } from "../agents/queue.js";
import { uniqueTenantCount } from "./analytics.utils.js";

export async function getMasterAdminDashboard() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [organizationsCount, subscriptions, workflowWau, workflowMau, agentWau, agentMau, usageRows] =
    await Promise.all([
      prisma.organization.count(),
      prisma.subscription.findMany({
        include: {
          plan: true
        }
      }),
      prisma.workflowExecution.findMany({
        distinct: ["tenantId"],
        select: {
          tenantId: true
        },
        where: {
          startedAt: {
            gte: weekAgo
          }
        }
      }),
      prisma.workflowExecution.findMany({
        distinct: ["tenantId"],
        select: {
          tenantId: true
        },
        where: {
          startedAt: {
            gte: monthAgo
          }
        }
      }),
      prisma.agentExecution.findMany({
        distinct: ["tenantId"],
        select: {
          tenantId: true
        },
        where: {
          startedAt: {
            gte: weekAgo
          }
        }
      }),
      prisma.agentExecution.findMany({
        distinct: ["tenantId"],
        select: {
          tenantId: true
        },
        where: {
          startedAt: {
            gte: monthAgo
          }
        }
      }),
      prisma.usageRecord.findMany({
        select: {
          metric: true,
          quantity: true
        },
        where: {
          occurredAt: {
            gte: monthAgo
          }
        }
      })
    ]);

  const activeStatuses = new Set<SubscriptionStatus>([
    SubscriptionStatus.active,
    SubscriptionStatus.past_due,
    SubscriptionStatus.paused
  ]);
  const paying = subscriptions.filter((subscription) => activeStatuses.has(subscription.status));
  const totalArrCents = paying.reduce(
    (total, subscription) => total + subscription.plan.monthlyPriceCents * 12,
    0
  );
  const llmUsageRows = usageRows.filter((row) =>
    row.metric.startsWith("agent.") ||
    row.metric.startsWith("llm.") ||
    row.metric.includes("openai") ||
    row.metric.includes("anthropic")
  );
  const llmCostRows = usageRows.filter((row) => row.metric.includes("cost"));

  return {
    llmApiCalls: llmUsageRows.reduce((total, row) => total + row.quantity, 0),
    llmCostCents: llmCostRows.reduce((total, row) => total + row.quantity, 0),
    totalArrCents,
    totalOrganizations: organizationsCount,
    wau: uniqueTenantCount([
      ...workflowWau.map((row) => row.tenantId),
      ...agentWau.map((row) => row.tenantId)
    ]),
    mau: uniqueTenantCount([
      ...workflowMau.map((row) => row.tenantId),
      ...agentMau.map((row) => row.tenantId)
    ])
  };
}

export async function getOperationsDashboard() {
  const since = new Date(Date.now() - 5 * 60 * 1000);
  const tenantRows = await prisma.agentExecution.findMany({
    distinct: ["tenantId"],
    select: {
      tenantId: true
    },
    where: {
      startedAt: {
        gte: since
      }
    }
  });

  const [pendingApprovals, recentBudgetAlerts, highCostAgents, failRateAlerts, queue] =
    await Promise.all([
      prisma.outputArtifact.count({
        where: {
          status: "WAITING_APPROVAL"
        }
      }),
      prisma.agentBudgetEvent.findMany({
        orderBy: {
          createdAt: "desc"
        },
        take: 10,
        where: {
          kind: {
            in: ["WARN_80", "BLOCK_100"]
          }
        }
      }),
      prisma.agentBudgetEvent.groupBy({
        _sum: {
          costBrl: true
        },
        by: ["agentId", "tenantId"],
        orderBy: {
          _sum: {
            costBrl: "desc"
          }
        },
        take: 10,
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          },
          kind: "CONSUME"
        }
      }),
      Promise.all(
        tenantRows.map((row) => agentMetricsService.detectFailRateAlerts(row.tenantId, 0.2, 5))
      ).then((items) => items.flat()),
      getInstalledAgentQueueStats(getApiConfig()).catch(() => ({
        active: 0,
        completed: 0,
        delayed: 0,
        failed: 0,
        pending: 0,
        prioritized: 0,
        queueName: "agent-normal",
        waiting: 0
      }))
    ]);

  return {
    failRateAlerts: failRateAlerts
      .sort((left, right) => right.failRate - left.failRate)
      .slice(0, 10),
    highCostAgents: highCostAgents.map((row) => ({
      agentId: row.agentId,
      tenantId: row.tenantId,
      totalCostBrl: Number((row._sum.costBrl ?? 0).toFixed(2))
    })),
    pendingApprovals,
    queue,
    recentBudgetAlerts: recentBudgetAlerts.map((event) => ({
      agentId: event.agentId,
      createdAt: event.createdAt.toISOString(),
      kind: event.kind,
      tenantId: event.tenantId
    }))
  };
}
