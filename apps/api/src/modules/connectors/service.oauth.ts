import type { ApiConfig } from "@birthub/config";
import { prisma } from "@birthub/database";

import { ProblemDetailsError } from "../../lib/problem-details.js";
import {
  buildAuthorizationUrl,
  buildOauthState,
  getProviderOauthConfig,
  resolveConnectorAccount,
  sanitizeConnectorAccount,
  toJsonValue,
  upsertCredentials,
  type ConnectorCredentialsRecord,
  type ConnectorProvider
} from "./service.shared.js";

export async function createConnectSession(input: {
  accountKey?: string | undefined;
  config: ApiConfig;
  organizationId: string;
  provider: ConnectorProvider;
  requestId: string;
  scopes?: string[] | undefined;
  tenantId: string;
  userId: string;
}) {
  const oauth = getProviderOauthConfig(input.config, input.provider);
  if (!oauth) {
    throw new ProblemDetailsError({
      detail: `Provider '${input.provider}' is not configured for OAuth in this environment.`,
      status: 409,
      title: "Connector OAuth Not Configured"
    });
  }

  const state = buildOauthState({
    accountKey: input.accountKey ?? "primary",
    organizationId: input.organizationId,
    provider: input.provider,
    requestId: input.requestId,
    tenantId: input.tenantId,
    userId: input.userId
  });
  const scopes = input.scopes?.length ? input.scopes : oauth.defaultScopes;
  const account = await prisma.connectorAccount.upsert({
    create: {
      accountKey: input.accountKey ?? "primary",
      authType: "oauth",
      metadata: toJsonValue({
        oauthState: state,
        requestedScopes: scopes
      }),
      organizationId: input.organizationId,
      provider: input.provider,
      scopes: toJsonValue(scopes),
      status: "pending",
      tenantId: input.tenantId
    },
    update: {
      metadata: toJsonValue({
        oauthState: state,
        requestedScopes: scopes
      }),
      scopes: toJsonValue(scopes),
      status: "pending"
    },
    where: {
      organizationId_provider_accountKey: {
        accountKey: input.accountKey ?? "primary",
        organizationId: input.organizationId,
        provider: input.provider
      }
    }
  });

  return {
    authorizationUrl: buildAuthorizationUrl({
      oauth,
      provider: input.provider,
      scopes,
      state
    }),
    connector: sanitizeConnectorAccount(
      await resolveConnectorAccount({
        accountKey: account.accountKey,
        organizationId: input.organizationId,
        provider: input.provider
      })
    ),
    state
  };
}

export async function finalizeConnectSession(input: {
  accessToken?: string | undefined;
  accountKey?: string | undefined;
  code?: string | undefined;
  displayName?: string | undefined;
  expiresAt?: string | undefined;
  externalAccountId?: string | undefined;
  organizationId: string;
  provider: ConnectorProvider;
  refreshToken?: string | undefined;
  scopes?: string[] | undefined;
  state: string;
  tenantId: string;
}) {
  const account = await resolveConnectorAccount({
    accountKey: input.accountKey,
    organizationId: input.organizationId,
    provider: input.provider
  });

  if (!account) {
    throw new ProblemDetailsError({
      detail: "Connector account was not initialized for this callback.",
      status: 404,
      title: "Connector Not Found"
    });
  }

  const metadata =
    account.metadata && typeof account.metadata === "object"
      ? (account.metadata as Record<string, unknown>)
      : {};
  if (metadata.oauthState !== input.state) {
    throw new ProblemDetailsError({
      detail: "Connector OAuth state validation failed.",
      status: 409,
      title: "Connector State Mismatch"
    });
  }

  const credentials: ConnectorCredentialsRecord = {};
  if (input.code) {
    credentials.authorization_code = {
      value: input.code
    };
  }
  if (input.accessToken) {
    credentials.access_token = {
      ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
      value: input.accessToken
    };
  }
  if (input.refreshToken) {
    credentials.refresh_token = {
      value: input.refreshToken
    };
  }

  await prisma.connectorAccount.update({
    data: {
      connectedAt: new Date(),
      ...(input.displayName ? { displayName: input.displayName } : {}),
      ...(input.externalAccountId ? { externalAccountId: input.externalAccountId } : {}),
      metadata: toJsonValue({
        callbackReceivedAt: new Date().toISOString(),
        requestedScopes: input.scopes ?? metadata.requestedScopes ?? [],
        stateValidated: true
      }),
      ...(input.scopes ? { scopes: toJsonValue(input.scopes) } : {}),
      status:
        input.accessToken || input.refreshToken
          ? "active"
          : input.code
            ? "pending_token_exchange"
            : "pending"
    },
    where: {
      id: account.id
    }
  });

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
      accountKey: account.accountKey,
      organizationId: input.organizationId,
      provider: input.provider
    })
  );
}
