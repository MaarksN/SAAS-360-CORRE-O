import type { ApiConfig } from "@birthub/config";
import { Prisma, prisma } from "@birthub/database";

import { encryptConnectorToken } from "../../lib/encryption.js";
import { ProblemDetailsError } from "../../lib/problem-details.js";

export type ConnectorProvider =
  | "google-workspace"
  | "hubspot"
  | "microsoft-graph"
  | "pipedrive"
  | "salesforce"
  | "twilio-whatsapp";

export interface ConnectorOauthState {
  accountKey: string;
  organizationId: string;
  provider: ConnectorProvider;
  requestId: string;
  tenantId: string;
  userId: string;
  version: 1;
}

const connectorProviders = new Set<ConnectorProvider>([
  "google-workspace",
  "hubspot",
  "microsoft-graph",
  "pipedrive",
  "salesforce",
  "twilio-whatsapp"
]);

type ConnectorCredentialInput = {
  expiresAt?: string | undefined;
  value: string;
};

export type ConnectorCredentialsRecord = Record<string, ConnectorCredentialInput>;

export function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function parseExpiry(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeCredentials(input?: Record<string, ConnectorCredentialInput>): ConnectorCredentialsRecord {
  return input ?? {};
}

export function buildOauthState(input: {
  accountKey: string;
  organizationId: string;
  provider: ConnectorProvider;
  requestId: string;
  tenantId: string;
  userId: string;
}): string {
  return Buffer.from(
    JSON.stringify({
      accountKey: input.accountKey,
      organizationId: input.organizationId,
      provider: input.provider,
      requestId: input.requestId,
      tenantId: input.tenantId,
      userId: input.userId,
      version: 1
    })
  ).toString("base64url");
}

export function parseConnectorOauthState(state: string): ConnectorOauthState {
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as unknown;

    if (!parsed || typeof parsed !== "object") {
      throw new Error("State payload is not an object.");
    }

    const candidate = parsed as Record<string, unknown>;
    if (
      typeof candidate.accountKey !== "string" ||
      typeof candidate.organizationId !== "string" ||
      typeof candidate.provider !== "string" ||
      typeof candidate.requestId !== "string" ||
      typeof candidate.tenantId !== "string" ||
      typeof candidate.userId !== "string" ||
      candidate.version !== 1
    ) {
      throw new Error("State payload is missing required fields.");
    }

    if (!connectorProviders.has(candidate.provider as ConnectorProvider)) {
      throw new Error(`Unsupported provider '${String(candidate.provider)}' in OAuth state.`);
    }

    const provider = candidate.provider as ConnectorProvider;

    return {
      accountKey: candidate.accountKey,
      organizationId: candidate.organizationId,
      provider,
      requestId: candidate.requestId,
      tenantId: candidate.tenantId,
      userId: candidate.userId,
      version: 1
    };
  } catch (error) {
    throw new ProblemDetailsError({
      detail: error instanceof Error ? error.message : "Connector OAuth state could not be parsed.",
      status: 409,
      title: "Connector OAuth State Invalid"
    });
  }
}

export function getProviderOauthConfig(config: ApiConfig, provider: ConnectorProvider): {
  authorizationUrl: string;
  clientId: string;
  defaultScopes: string[];
  redirectUri: string;
} | null {
  switch (provider) {
    case "hubspot":
      if (
        !config.HUBSPOT_CLIENT_ID ||
        !config.HUBSPOT_CLIENT_SECRET ||
        !config.HUBSPOT_REDIRECT_URI
      ) {
        return null;
      }

      return {
        authorizationUrl: "https://app.hubspot.com/oauth/authorize",
        clientId: config.HUBSPOT_CLIENT_ID,
        defaultScopes: ["crm.objects.companies.read", "crm.objects.companies.write"],
        redirectUri: config.HUBSPOT_REDIRECT_URI
      };
    case "google-workspace":
      if (
        !config.GOOGLE_CLIENT_ID ||
        !config.GOOGLE_CLIENT_SECRET ||
        !config.GOOGLE_REDIRECT_URI
      ) {
        return null;
      }

      return {
        authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        clientId: config.GOOGLE_CLIENT_ID,
        defaultScopes: [
          "https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/gmail.send"
        ],
        redirectUri: config.GOOGLE_REDIRECT_URI
      };
    case "microsoft-graph":
      if (
        !config.MICROSOFT_CLIENT_ID ||
        !config.MICROSOFT_CLIENT_SECRET ||
        !config.MICROSOFT_REDIRECT_URI
      ) {
        return null;
      }

      return {
        authorizationUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        clientId: config.MICROSOFT_CLIENT_ID,
        defaultScopes: ["offline_access", "Calendars.ReadWrite", "Mail.Send", "User.Read"],
        redirectUri: config.MICROSOFT_REDIRECT_URI
      };
    default:
      return null;
  }
}

export function buildAuthorizationUrl(input: {
  provider: ConnectorProvider;
  scopes: string[];
  state: string;
  oauth: {
    authorizationUrl: string;
    clientId: string;
    redirectUri: string;
  };
}): string {
  const url = new URL(input.oauth.authorizationUrl);
  url.searchParams.set("client_id", input.oauth.clientId);
  url.searchParams.set("redirect_uri", input.oauth.redirectUri);
  url.searchParams.set("state", input.state);

  switch (input.provider) {
    case "hubspot":
      url.searchParams.set("scope", input.scopes.join(" "));
      break;
    case "google-workspace":
      url.searchParams.set("access_type", "offline");
      url.searchParams.set("prompt", "consent");
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", input.scopes.join(" "));
      break;
    case "microsoft-graph":
      url.searchParams.set("response_type", "code");
      url.searchParams.set("response_mode", "query");
      url.searchParams.set("scope", input.scopes.join(" "));
      break;
    default:
      throw new Error(`Unsupported OAuth provider: ${input.provider}`);
  }

  return url.toString();
}

export async function resolveConnectorAccount(input: {
  accountKey?: string | undefined;
  organizationId: string;
  provider: ConnectorProvider;
}) {
  return prisma.connectorAccount.findFirst({
    include: {
      _count: {
        select: {
          threads: true
        }
      },
      credentials: {
        orderBy: {
          createdAt: "asc"
        }
      },
      syncCursors: {
        orderBy: {
          updatedAt: "desc"
        }
      },
      threads: {
        orderBy: {
          updatedAt: "desc"
        },
        take: 10
      }
    },
    where: {
      accountKey: input.accountKey ?? "primary",
      organizationId: input.organizationId,
      provider: input.provider
    }
  });
}

export function sanitizeConnectorAccount(
  account: Awaited<ReturnType<typeof resolveConnectorAccount>>
) {
  if (!account) {
    return null;
  }

  return {
    accountKey: account.accountKey,
    authType: account.authType,
    connectedAt: account.connectedAt?.toISOString() ?? null,
    credentialMetadata: account.credentials.map((credential) => ({
      credentialType: credential.credentialType,
      expiresAt: credential.expiresAt?.toISOString() ?? null
    })),
    displayName: account.displayName,
    externalAccountId: account.externalAccountId,
    id: account.id,
    lastSyncAt: account.lastSyncAt?.toISOString() ?? null,
    metadata: account.metadata,
    provider: account.provider,
    scopes: account.scopes,
    status: account.status,
    recentThreads: account.threads.map((thread) => ({
      channel: thread.channel,
      correlationId: thread.correlationId,
      id: thread.id,
      status: thread.status,
      updatedAt: thread.updatedAt.toISOString()
    })),
    syncCursors: account.syncCursors.map((cursor) => ({
      errorMessage: cursor.errorMessage,
      id: cursor.id,
      lastSyncAt: cursor.lastSyncAt?.toISOString() ?? null,
      nextSyncAt: cursor.nextSyncAt?.toISOString() ?? null,
      scope: cursor.scope,
      status: cursor.status
    })),
    threadCount: account._count.threads,
    updatedAt: account.updatedAt.toISOString()
  };
}

export async function upsertCredentials(input: {
  connectorAccountId: string;
  credentials: ConnectorCredentialsRecord;
  organizationId: string;
  tenantId: string;
}) {
  const entries = Object.entries(input.credentials);
  await Promise.all(
    entries.map(async ([credentialType, credential]) =>
      prisma.connectorCredential.upsert({
        create: {
          connectorAccountId: input.connectorAccountId,
          credentialType,
          encryptedValue: encryptConnectorToken(credential.value),
          ...(credential.expiresAt ? { expiresAt: parseExpiry(credential.expiresAt) } : {}),
          organizationId: input.organizationId,
          tenantId: input.tenantId
        },
        update: {
          encryptedValue: encryptConnectorToken(credential.value),
          expiresAt: parseExpiry(credential.expiresAt)
        },
        where: {
          connectorAccountId_credentialType: {
            connectorAccountId: input.connectorAccountId,
            credentialType
          }
        }
      })
    )
  );
}
