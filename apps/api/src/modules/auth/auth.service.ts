import {
  UserStatus,
  Role,
  prisma
} from "@birthub/database";
import type { ApiConfig } from "@birthub/config";

import {
  sha256,
  verifyAccessToken
} from "./crypto.js";
import {
  enableMfaForUser,
  loginWithPassword,
  setupMfaForUser,
  verifyMfaChallenge
} from "./auth.service.credentials.js";
import {
  createSession,
  listActiveSessions,
  refreshSession,
  revokeAllSessions,
  revokeCurrentSession,
  revokeSessionById
} from "./auth.service.sessions.js";
import {
  getRoleForUser,
  assertRole,
  suspendUser,
  updateUserRoleWithAudit
} from "./auth.service.policies.js";
import {
  createTenantApiKey,
  listTenantApiKeys,
  rotateTenantApiKey,
  revokeTenantApiKey,
  introspectApiKey,
  verifyApiKeyScope
} from "./auth.service.keys.js";
import {
  ApiKeyScope,
  AuthenticatedContext,
  SessionTokens,
  canManageRole,
  resolveOrganizationId,
  resolveAuthorizedTenantContext
} from "./auth.service.shared.js";

export {
  createSession,
  enableMfaForUser,
  listActiveSessions,
  loginWithPassword,
  refreshSession,
  revokeAllSessions,
  revokeCurrentSession,
  revokeSessionById,
  setupMfaForUser,
  verifyMfaChallenge,
  getRoleForUser,
  assertRole,
  suspendUser,
  updateUserRoleWithAudit,
  createTenantApiKey,
  listTenantApiKeys,
  rotateTenantApiKey,
  revokeTenantApiKey,
  introspectApiKey,
  verifyApiKeyScope,
  resolveOrganizationId,
  resolveAuthorizedTenantContext,
  canManageRole
};

export type { ApiKeyScope, AuthenticatedContext, SessionTokens };

function isRole(value: unknown): value is Role {
  return Object.values(Role).includes(value as Role);
}

function resolveVerifiedSessionRole(input: {
  organizationId: string;
  sessionId: string;
  tenantId: string;
  token: string;
  userId: string;
  secret?: string;
}): Role | null {
  if (!input.secret) {
    return null;
  }

  const claims = verifyAccessToken(input.token, input.secret);
  if (!claims) {
    return null;
  }

  if (
    claims.organizationId !== input.organizationId ||
    claims.sessionId !== input.sessionId ||
    claims.tenantId !== input.tenantId ||
    claims.userId !== input.userId
  ) {
    return null;
  }

  return isRole(claims.role) ? claims.role : null;
}

async function authenticateApiKey(token: string): Promise<AuthenticatedContext | null> {
  const apiKey = await introspectApiKey(token);
  if (!apiKey.active || !apiKey.userId || !apiKey.tenantId) {
    return null;
  }

  const organizationId = await resolveOrganizationId(apiKey.tenantId);
  if (!organizationId) {
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: apiKey.userId } });
  if (!user || user.status === UserStatus.SUSPENDED) {
    return null;
  }

  const role = await getRoleForUser({
    organizationId,
    userId: apiKey.userId
  });

  return {
    apiKeyId: apiKey.apiKeyId,
    authType: "api-key",
    organizationId,
    role,
    sessionId: null,
    tenantId: apiKey.tenantId,
    userId: apiKey.userId
  };
}

async function authenticateSession(
  token: string,
  config?: Pick<ApiConfig, "API_AUTH_IDLE_TIMEOUT_MINUTES"> &
    Partial<Pick<ApiConfig, "SESSION_SECRET">>
): Promise<AuthenticatedContext | null> {
  const session = await prisma.session.findUnique({ where: { token: sha256(token) } });
  if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
    return null;
  }

  const idleExpiry = (session.lastActivityAt instanceof Date ? session.lastActivityAt.getTime() : Date.now()) + 60_000 * (config?.API_AUTH_IDLE_TIMEOUT_MINUTES ?? 30);
  if (idleExpiry < Date.now() || (session.refreshExpiresAt && session.refreshExpiresAt.getTime() < Date.now())) {
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.status === UserStatus.SUSPENDED) {
    return null;
  }

  await prisma.session.update({ data: { lastActivityAt: new Date() }, where: { id: session.id } });

  const role =
    resolveVerifiedSessionRole({
      organizationId: session.organizationId,
      ...(config?.SESSION_SECRET
        ? {
            secret: config.SESSION_SECRET
          }
        : {}),
      sessionId: session.id,
      tenantId: session.tenantId,
      token,
      userId: session.userId
    }) ??
    (await getRoleForUser({
      organizationId: session.organizationId,
      userId: session.userId
    }));

  return {
    apiKeyId: null,
    authType: "session",
    organizationId: session.organizationId,
    role,
    sessionId: session.id,
    tenantId: session.tenantId,
    userId: session.userId
  };
}

export async function authenticateRequest(input: {
  apiKeyToken?: string | null;
  config?: Pick<ApiConfig, "API_AUTH_IDLE_TIMEOUT_MINUTES"> &
    Partial<Pick<ApiConfig, "SESSION_SECRET">>;
  sessionToken?: string | null;
}): Promise<AuthenticatedContext | null> {
  if (input.apiKeyToken) {
    return authenticateApiKey(input.apiKeyToken);
  }

  if (input.sessionToken) {
    return authenticateSession(input.sessionToken, input.config);
  }

  return null;
}
