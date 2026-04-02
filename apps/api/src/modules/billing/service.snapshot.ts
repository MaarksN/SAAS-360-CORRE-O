import type { ApiConfig } from "@birthub/config";
import {
  BillingCreditReason,
  SubscriptionStatus,
  prisma
} from "@birthub/database";

import {
  deleteCacheKeys,
  readCacheValue,
  writeCacheValue
} from "../../common/cache/cache-store.js";
import { ProblemDetailsError } from "../../lib/problem-details.js";
import {
  isPlanFeatureEnabled,
  readNumericPlanLimit,
  type PlanFeature
} from "./plan.utils.js";
import {
  ensurePlanByCode,
  type BillingSnapshot,
  type DatabaseClient
} from "./service.shared.js";

const BILLING_SNAPSHOT_CACHE_TTL_SECONDS = 60;

function billingSnapshotCacheKey(reference: string): string {
  return `billing:snapshot:${reference.trim().toLowerCase()}`;
}

function serializeBillingSnapshot(snapshot: BillingSnapshot): string {
  return JSON.stringify({
    ...snapshot,
    currentPeriodEnd: snapshot.currentPeriodEnd?.toISOString() ?? null,
    gracePeriodEndsAt: snapshot.gracePeriodEndsAt?.toISOString() ?? null
  });
}

function parseBillingSnapshot(raw: string): BillingSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as {
      currentPeriodEnd: string | null;
      gracePeriodEndsAt: string | null;
    } & Omit<BillingSnapshot, "currentPeriodEnd" | "gracePeriodEndsAt">;

    return {
      ...parsed,
      currentPeriodEnd: parsed.currentPeriodEnd ? new Date(parsed.currentPeriodEnd) : null,
      gracePeriodEndsAt: parsed.gracePeriodEndsAt
        ? new Date(parsed.gracePeriodEndsAt)
        : null
    };
  } catch {
    return null;
  }
}

async function cacheBillingSnapshot(
  snapshot: BillingSnapshot,
  extraReference?: string
): Promise<void> {
  const references = new Set<string>([
    snapshot.organizationId,
    snapshot.tenantId,
    ...(extraReference ? [extraReference] : [])
  ]);

  await Promise.all(
    Array.from(references).map((reference) =>
      writeCacheValue(
        billingSnapshotCacheKey(reference),
        serializeBillingSnapshot(snapshot),
        BILLING_SNAPSHOT_CACHE_TTL_SECONDS
      )
    )
  );
}

export async function invalidateBillingSnapshotCache(
  references: Array<string | null | undefined>
) {
  await deleteCacheKeys(
    Array.from(
      new Set(
        references
          .filter((reference): reference is string => Boolean(reference?.trim()))
          .map((reference) => billingSnapshotCacheKey(reference))
      )
    )
  );
}

function checkoutDeclineCounterKey(ipAddress: string): string {
  return `billing:checkout:declines:${ipAddress}`;
}

function checkoutBanKey(ipAddress: string): string {
  return `billing:checkout:ban:${ipAddress}`;
}

export async function isCheckoutIpTemporarilyBanned(
  ipAddress: string | null | undefined
): Promise<boolean> {
  if (!ipAddress) {
    return false;
  }

  return Boolean(await readCacheValue(checkoutBanKey(ipAddress)));
}

export async function clearCheckoutIpBan(
  ipAddress: string | null | undefined
): Promise<void> {
  if (!ipAddress) {
    return;
  }

  await deleteCacheKeys([checkoutBanKey(ipAddress), checkoutDeclineCounterKey(ipAddress)]);
}

export async function registerCheckoutDecline(input: {
  config: ApiConfig;
  ipAddress: string | null | undefined;
}): Promise<number> {
  if (!input.ipAddress) {
    return 0;
  }

  const current = Number(
    (await readCacheValue(checkoutDeclineCounterKey(input.ipAddress))) ?? "0"
  );
  const next = current + 1;

  await writeCacheValue(
    checkoutDeclineCounterKey(input.ipAddress),
    String(next),
    input.config.STRIPE_TEMP_BAN_SECONDS
  );

  if (next >= input.config.STRIPE_DECLINE_BAN_THRESHOLD) {
    await writeCacheValue(
      checkoutBanKey(input.ipAddress),
      "1",
      input.config.STRIPE_TEMP_BAN_SECONDS
    );
  }

  return next;
}

function resolveGracePeriodEndsAt(
  subscription:
    | {
        gracePeriodEndsAt: Date | null;
        updatedAt: Date;
      }
    | null
    | undefined,
  gracePeriodDays: number
): Date | null {
  if (!subscription) {
    return null;
  }

  if (subscription.gracePeriodEndsAt) {
    return subscription.gracePeriodEndsAt;
  }

  return new Date(subscription.updatedAt.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);
}

async function findBillingOrganization(organizationReference: string) {
  return prisma.organization.findFirst({
    include: {
      plan: true,
      subscriptions: {
        include: {
          plan: true
        },
        orderBy: {
          updatedAt: "desc"
        },
        take: 1
      }
    },
    where: {
      OR: [{ id: organizationReference }, { tenantId: organizationReference }]
    }
  });
}

async function resolveBillingPlan(
  organization: NonNullable<Awaited<ReturnType<typeof findBillingOrganization>>>
) {
  const subscription = organization.subscriptions[0] ?? null;
  return subscription?.plan ?? organization.plan ?? (await ensurePlanByCode("starter"));
}

function buildBillingSnapshot(input: {
  creditBalanceCents: number;
  gracePeriodDays: number;
  organization: NonNullable<Awaited<ReturnType<typeof findBillingOrganization>>>;
  plan: Awaited<ReturnType<typeof ensurePlanByCode>>;
}): BillingSnapshot {
  const subscription = input.organization.subscriptions[0] ?? null;
  const gracePeriodEndsAt = resolveGracePeriodEndsAt(subscription, input.gracePeriodDays);
  const isPastDue = subscription?.status === SubscriptionStatus.past_due;
  const hardLocked = Boolean(
    isPastDue && gracePeriodEndsAt && gracePeriodEndsAt.getTime() <= Date.now()
  );
  const secondsUntilHardLock =
    isPastDue && gracePeriodEndsAt
      ? Math.max(0, Math.floor((gracePeriodEndsAt.getTime() - Date.now()) / 1000))
      : null;
  const isPaidStatuses = new Set<SubscriptionStatus>([
    SubscriptionStatus.active,
    SubscriptionStatus.past_due,
    SubscriptionStatus.paused
  ]);

  return {
    creditBalanceCents: input.creditBalanceCents,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    gracePeriodEndsAt,
    hardLocked,
    isPaid: subscription ? isPaidStatuses.has(subscription.status) : false,
    isWithinGracePeriod: Boolean(isPastDue && gracePeriodEndsAt && !hardLocked),
    organizationId: input.organization.id,
    plan: {
      code: input.plan.code,
      id: input.plan.id,
      limits: input.plan.limits,
      name: input.plan.name
    },
    secondsUntilHardLock,
    status: subscription?.status ?? null,
    stripeCustomerId: input.organization.stripeCustomerId,
    subscriptionId: subscription?.id ?? null,
    tenantId: input.organization.tenantId
  };
}

async function getBillingCreditBalanceCents(
  organizationId: string,
  client: DatabaseClient = prisma
): Promise<number> {
  const aggregate = await client.billingCredit.aggregate({
    _sum: {
      amountCents: true
    },
    where: {
      organizationId,
      reason: BillingCreditReason.DOWNGRADE_PRORATION
    }
  });

  return aggregate._sum.amountCents ?? 0;
}

export async function getBillingSnapshot(
  organizationReference: string,
  gracePeriodDays: number
): Promise<BillingSnapshot> {
  const cached = await readCacheValue(billingSnapshotCacheKey(organizationReference));

  if (cached) {
    const parsed = parseBillingSnapshot(cached);
    if (parsed) {
      return parsed;
    }
  }

  const organization = await findBillingOrganization(organizationReference);

  if (!organization) {
    throw new ProblemDetailsError({
      detail: "Organization not found for billing context.",
      status: 404,
      title: "Not Found"
    });
  }

  const plan = await resolveBillingPlan(organization);
  const creditBalanceCents = await getBillingCreditBalanceCents(organization.id);
  const snapshot = buildBillingSnapshot({
    creditBalanceCents,
    gracePeriodDays,
    organization,
    plan
  });

  await cacheBillingSnapshot(snapshot, organizationReference);

  return snapshot;
}

export async function canUseFeature(
  organizationReference: string,
  feature: PlanFeature,
  gracePeriodDays: number
): Promise<{ allowed: boolean; snapshot: BillingSnapshot }> {
  const snapshot = await getBillingSnapshot(organizationReference, gracePeriodDays);
  const featureEnabled = isPlanFeatureEnabled(snapshot.plan.limits, feature);

  return {
    allowed: featureEnabled && !snapshot.hardLocked,
    snapshot
  };
}

export async function getAgentLimitForOrganization(
  organizationReference: string
): Promise<number> {
  const snapshot = await getBillingSnapshot(organizationReference, 3);
  return readNumericPlanLimit(snapshot.plan.limits, "agents", 5);
}
