import type { ApiConfig } from "@birthub/config";
import {
  MembershipStatus,
  Role,
  prisma
} from "@birthub/database";

export type ApiKeyScope =
  | "agents:read"
  | "agents:write"
  | "workflows:trigger"
  | "webhooks:receive";

export interface AuthenticatedContext {
  apiKeyId: string | null;
  authType: "api-key" | "session";
  organizationId: string;
  role: Role | null;
  sessionId: string | null;
  tenantId: string;
  userId: string;
}

export interface SessionTokens {
  csrfToken: string;
  expiresAt: Date;
  refreshToken: string;
  token: string;
}

export function rolePriority(role: Role): number {
  switch (role) {
    case Role.SUPER_ADMIN:
      return 5;
    case Role.OWNER:
      return 4;
    case Role.ADMIN:
      return 3;
    case Role.MEMBER:
      return 2;
    case Role.READONLY:
      return 1;
    default:
      return 0;
  }
}

export function canManageRole(currentRole: Role, targetRole: Role): boolean {
  if (currentRole === Role.SUPER_ADMIN) {
    return true;
  }

  if (currentRole === Role.OWNER) {
    return true;
  }

  if (currentRole === Role.ADMIN) {
    return targetRole === Role.MEMBER || targetRole === Role.READONLY;
  }

  return false;
}

export async function resolveOrganizationId(tenantId: string): Promise<string | null> {
  const organization = await findOrganizationByReference(tenantId);
  return organization?.id ?? null;
}

export async function resolveTenantIdForOrganization(
  organizationId: string
): Promise<string | null> {
  const organization = await prisma.organization.findFirst({
    where: {
      OR: [{ id: organizationId }, { tenantId: organizationId }]
    }
  });

  return organization?.tenantId ?? null;
}

export async function findOrganizationByReference(reference: string) {
  return prisma.organization.findFirst({
    where: {
      OR: [{ id: reference }, { slug: reference }, { tenantId: reference }]
    }
  });
}

export async function resolveAuthorizedTenantContext(input: {
  tenantReference: string;
  userId: string;
}): Promise<
  | { status: "forbidden" }
  | { status: "not-found" }
  | {
      status: "ok";
      organizationId: string;
      role: Role;
      tenantId: string;
      tenantSlug: string | null;
    }
> {
  const organization = await findOrganizationByReference(input.tenantReference);

  if (!organization) {
    return { status: "not-found" };
  }

  const membership = await prisma.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: input.userId
      }
    }
  });

  if (!membership || membership.status !== MembershipStatus.ACTIVE) {
    return { status: "forbidden" };
  }

  return {
    organizationId: organization.id,
    role: membership.role,
    status: "ok",
    tenantId: organization.tenantId,
    tenantSlug: organization.slug ?? null
  };
}

export function nowPlusHours(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function nowPlusMinutes(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function resolveConcurrentSessionLimit(role: Role): number {
  switch (role) {
    case Role.SUPER_ADMIN:
    case Role.OWNER:
    case Role.ADMIN:
      return 1;
    case Role.MEMBER:
    case Role.READONLY:
      return 3;
    default:
      return 2;
  }
}

export type AuthIdleConfig = Pick<ApiConfig, "API_AUTH_IDLE_TIMEOUT_MINUTES">;
// Refactored to include shared logic without duplicates
