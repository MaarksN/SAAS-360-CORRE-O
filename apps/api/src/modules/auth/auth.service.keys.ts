import type { ApiConfig } from "@birthub/config";
import {
  ApiKeyStatus,
  prisma
} from "@birthub/database";

import {
  createApiKey,
  sha256
} from "./crypto.js";
import {
  type ApiKeyScope,
  resolveTenantIdForOrganization
} from "./auth.service.shared.js";

export async function createTenantApiKey(input: {
  config: ApiConfig;
  label: string;
  organizationId: string;
  scopes: ApiKeyScope[];
  userId: string;
}) {
  const tenantId = await resolveTenantIdForOrganization(input.organizationId);

  if (!tenantId) {
    throw new Error("TENANT_NOT_FOUND");
  }

  const generated = createApiKey(input.config.API_KEY_PREFIX);
  const record = await prisma.apiKey.create({
    data: {
      keyHash: generated.hash,
      label: input.label,
      last4: generated.last4,
      organizationId: input.organizationId,
      prefix: generated.prefix,
      scopes: input.scopes,
      tenantId,
      userId: input.userId
    }
  });

  return {
    id: record.id,
    key: generated.key
  };
}

export async function listTenantApiKeys(input: {
  organizationId: string;
  userId: string;
}) {
  return prisma.apiKey.findMany({
    orderBy: {
      createdAt: "desc"
    },
    select: {
      createdAt: true,
      id: true,
      label: true,
      last4: true,
      scopes: true,
      status: true
    },
    where: {
      organizationId: input.organizationId,
      userId: input.userId
    }
  });
}

export async function rotateTenantApiKey(input: {
  config: ApiConfig;
  id: string;
  organizationId: string;
  userId: string;
}) {
  const current = await prisma.apiKey.findFirst({
    where: {
      id: input.id,
      organizationId: input.organizationId,
      userId: input.userId
    }
  });

  if (!current) {
    throw new Error("API_KEY_NOT_FOUND");
  }

  const generated = createApiKey(input.config.API_KEY_PREFIX);
  const graceExpiresAt = new Date(
    Date.now() + input.config.API_AUTH_ROTATION_GRACE_HOURS * 60 * 60 * 1000
  );

  const next = await prisma.$transaction(async (tx) => {
    await tx.apiKey.update({
      data: {
        graceExpiresAt,
        revokedAt: null,
        status: ApiKeyStatus.ACTIVE
      },
      where: {
        id: current.id
      }
    });

    return tx.apiKey.create({
      data: {
        keyHash: generated.hash,
        label: current.label,
        last4: generated.last4,
        organizationId: current.organizationId,
        prefix: current.prefix,
        rotatedFromId: current.id,
        scopes: current.scopes,
        tenantId: current.tenantId,
        userId: current.userId
      }
    });
  });

  return {
    id: next.id,
    key: generated.key
  };
}

export async function revokeTenantApiKey(input: {
  id: string;
  organizationId: string;
  userId: string;
}) {
  await prisma.apiKey.updateMany({
    data: {
      revokedAt: new Date(),
      status: ApiKeyStatus.REVOKED
    },
    where: {
      id: input.id,
      organizationId: input.organizationId,
      userId: input.userId
    }
  });
}

export async function introspectApiKey(rawToken: string): Promise<{
  active: boolean;
  apiKeyId: string | null;
  scopes: ApiKeyScope[];
  tenantId: string | null;
  userId: string | null;
}> {
  const hashed = sha256(rawToken);
  const apiKey = await prisma.apiKey.findUnique({
    where: {
      keyHash: hashed
    }
  });

  if (!apiKey) {
    return {
      active: false,
      apiKeyId: null,
      scopes: [],
      tenantId: null,
      userId: null
    };
  }

  const now = Date.now();
  const expired =
    (apiKey.expiresAt && apiKey.expiresAt.getTime() < now) ||
    (apiKey.graceExpiresAt && apiKey.graceExpiresAt.getTime() < now);
  const revoked = apiKey.status === ApiKeyStatus.REVOKED || Boolean(apiKey.revokedAt);

  if (expired || revoked) {
    return {
      active: false,
      apiKeyId: apiKey.id,
      scopes: [],
      tenantId: null,
      userId: null
    };
  }

  await prisma.apiKey.update({
    data: {
      lastUsedAt: new Date()
    },
    where: {
      id: apiKey.id
    }
  });

  const validScopes: ApiKeyScope[] = [
    "agents:read",
    "agents:write",
    "workflows:trigger",
    "webhooks:receive"
  ];

  const parsedScopes: ApiKeyScope[] = Array.isArray(apiKey.scopes)
    ? apiKey.scopes.filter(
        (scope): scope is ApiKeyScope =>
          typeof scope === "string" && (validScopes as string[]).includes(scope)
      )
    : [];

  return {
    active: true,
    apiKeyId: apiKey.id,
    scopes: parsedScopes,
    tenantId: apiKey.tenantId,
    userId: apiKey.userId
  };
}

export async function verifyApiKeyScope(input: {
  requiredScope: ApiKeyScope;
  token: string;
}): Promise<boolean> {
  const introspection = await introspectApiKey(input.token);

  return introspection.active && introspection.scopes.includes(input.requiredScope);
}
