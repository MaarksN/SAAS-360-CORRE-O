import type { ApiConfig } from "@birthub/config";
import { prisma } from "@birthub/database";

import { enqueueCrmSync } from "../engagement/queues.js";
import { createConnectSession, finalizeConnectSession } from "./service.oauth.js";
import {
  normalizeCredentials,
  parseConnectorOauthState,
  resolveConnectorAccount,
  sanitizeConnectorAccount,
  toJsonValue,
  upsertCredentials,
  type ConnectorCredentialsRecord,
  type ConnectorOauthState,
  type ConnectorProvider
} from "./service.shared.js";

export type { ConnectorOauthState, ConnectorProvider };
export { parseConnectorOauthState };

export const connectorsService = {
  async listConnectors(input: { organizationId: string }) {
    const accounts = await prisma.connectorAccount.findMany({
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
      orderBy: [{ provider: "asc" }, { accountKey: "asc" }],
      where: {
        organizationId: input.organizationId
      }
    });

    return accounts.map((account) => sanitizeConnectorAccount(account));
  },

  async upsertConnector(input: {
    accountKey?: string | undefined;
    authType?: string | undefined;
    credentials?: ConnectorCredentialsRecord | undefined;
    displayName?: string | undefined;
    externalAccountId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    organizationId: string;
    provider: ConnectorProvider;
    scopes?: string[] | undefined;
    status?: string | undefined;
    tenantId: string;
  }) {
    const account = await prisma.connectorAccount.upsert({
      create: {
        accountKey: input.accountKey ?? "primary",
        authType: input.authType ?? "oauth",
        ...(input.displayName ? { displayName: input.displayName } : {}),
        ...(input.externalAccountId ? { externalAccountId: input.externalAccountId } : {}),
        ...(input.metadata ? { metadata: toJsonValue(input.metadata) } : {}),
        organizationId: input.organizationId,
        provider: input.provider,
        ...(input.scopes ? { scopes: toJsonValue(input.scopes) } : {}),
        status: input.status ?? "active",
        tenantId: input.tenantId
      },
      update: {
        authType: input.authType ?? "oauth",
        ...(input.displayName ? { displayName: input.displayName } : {}),
        ...(input.externalAccountId ? { externalAccountId: input.externalAccountId } : {}),
        ...(input.metadata ? { metadata: toJsonValue(input.metadata) } : {}),
        ...(input.scopes ? { scopes: toJsonValue(input.scopes) } : {}),
        status: input.status ?? "active"
      },
      where: {
        organizationId_provider_accountKey: {
          accountKey: input.accountKey ?? "primary",
          organizationId: input.organizationId,
          provider: input.provider
        }
      }
    });

    const credentials = normalizeCredentials(input.credentials);
    if (Object.keys(credentials).length > 0) {
      await upsertCredentials({
        connectorAccountId: account.id,
        credentials,
        organizationId: input.organizationId,
        tenantId: input.tenantId
      });
    }

    return sanitizeConnectorAccount(
      await resolveConnectorAccount({
        accountKey: input.accountKey,
        organizationId: input.organizationId,
        provider: input.provider
      })
    );
  },

  createConnectSession,
  finalizeConnectSession,

  async triggerSync(input: {
    accountKey?: string | undefined;
    config: ApiConfig;
    cursor?: Record<string, unknown> | undefined;
    organizationId: string;
    provider: ConnectorProvider;
    scope?: string | undefined;
    tenantId: string;
  }) {
    const account = await resolveConnectorAccount({
      accountKey: input.accountKey,
      organizationId: input.organizationId,
      provider: input.provider
    });
    const scope = input.scope ?? `${input.provider}:default`;

    if (account) {
      await prisma.connectorSyncCursor.upsert({
        create: {
          ...(input.cursor ? { cursor: toJsonValue(input.cursor) } : { cursor: toJsonValue({}) }),
          connectorAccountId: account.id,
          lastSyncAt: new Date(),
          organizationId: input.organizationId,
          scope,
          status: "queued",
          tenantId: input.tenantId
        },
        update: {
          ...(input.cursor ? { cursor: toJsonValue(input.cursor) } : {}),
          lastSyncAt: new Date(),
          status: "queued"
        },
        where: {
          connectorAccountId_scope: {
            connectorAccountId: account.id,
            scope
          }
        }
      });

      await prisma.connectorAccount.update({
        data: {
          lastSyncAt: new Date(),
          status: account.status === "pending" ? "syncing" : account.status
        },
        where: {
          id: account.id
        }
      });
    }

    let queued = false;
    if (input.provider === "hubspot") {
      await enqueueCrmSync(input.config, {
        kind: "company-upsert",
        organizationId: input.organizationId,
        tenantId: input.tenantId
      });
      queued = true;
    }

    return {
      provider: input.provider,
      queued,
      scope
    };
  }
};
