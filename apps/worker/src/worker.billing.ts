import { prisma } from "@birthub/database";
import type { Redis } from "ioredis";

function billingCacheKey(tenantReference: string): string {
  return `billing-status:${tenantReference}`;
}

export function calculateGraceBoundary(updatedAt: Date, gracePeriodDays: number): Date {
  return new Date(updatedAt.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);
}

export function createBillingLockResolver(input: {
  billingGracePeriodDays: number;
  billingStatusCacheTtlSeconds: number;
  connection: Redis;
}) {
  return async (
    tenantReference: string
  ): Promise<{ locked: boolean; status: string | null }> => {
    const cached = await input.connection.get(billingCacheKey(tenantReference));

    if (cached) {
      return JSON.parse(cached) as { locked: boolean; status: string | null };
    }

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
        OR: [{ id: tenantReference }, { tenantId: tenantReference }]
      }
    });
    const subscription = organization?.subscriptions[0] ?? null;
    const status = subscription?.status ?? null;
    const graceBoundary =
      subscription && status === "past_due"
        ? subscription.gracePeriodEndsAt ??
          calculateGraceBoundary(subscription.updatedAt, input.billingGracePeriodDays)
        : null;
    const locked = Boolean(
      status === "past_due" && graceBoundary && graceBoundary.getTime() <= Date.now()
    );
    const payload = {
      locked,
      status
    };

    await input.connection.set(
      billingCacheKey(tenantReference),
      JSON.stringify(payload),
      "EX",
      input.billingStatusCacheTtlSeconds
    );

    return payload;
  };
}
