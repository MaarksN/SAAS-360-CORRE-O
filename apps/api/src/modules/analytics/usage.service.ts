import { prisma } from "@birthub/database";

import type { DateRange } from "./analytics.types.js";
import { resolveDateRange } from "./analytics.utils.js";

export async function getUsageMetrics(range?: Partial<DateRange>) {
  const { from, to } = resolveDateRange(range);
  const usage = await prisma.usageRecord.groupBy({
    _sum: {
      quantity: true
    },
    by: ["metric", "tenantId"],
    where: {
      occurredAt: {
        gte: from,
        lte: to
      }
    }
  });

  return usage.map((row) => ({
    metric: row.metric,
    quantity: row._sum.quantity ?? 0,
    tenantId: row.tenantId
  }));
}

export async function getActiveTenantsMetrics() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [workflowDau, workflowMau, usageMau] = await Promise.all([
    prisma.workflowExecution.findMany({
      distinct: ["tenantId"],
      select: {
        tenantId: true
      },
      where: {
        startedAt: {
          gte: dayAgo
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
    prisma.usageRecord.findMany({
      distinct: ["tenantId"],
      select: {
        tenantId: true
      },
      where: {
        metric: {
          startsWith: "agent."
        },
        occurredAt: {
          gte: monthAgo
        }
      }
    })
  ]);
  const monthlyActive = new Set<string>([
    ...workflowMau.map((row) => row.tenantId),
    ...usageMau.map((row) => row.tenantId)
  ]);

  return {
    dau: workflowDau.length,
    mau: monthlyActive.size
  };
}
