import type { ApiConfig } from "@birthub/config";
import { MembershipStatus, prisma } from "@birthub/database";
import { createLogger } from "@birthub/logger";
import type { Redis } from "ioredis";
import type { Request, RequestHandler, Response } from "express";

import { ProblemDetailsError, toProblemDetails } from "../lib/problem-details.js";
import { getSharedRedis } from "../lib/redis.js";

const logger = createLogger("api-rate-limit");
const memoryRateLimitStore = new Map<string, { count: number; expiresAt: number }>();

type RateLimitScope = "api" | "login" | "webhook";

function resolveEndpointKey(request: Request): string {
  const normalizedPath = (request.path || "/").replace(/\/+/g, "/").replace(/\/$/, "") || "/";
  return `${request.method.toUpperCase()}:${normalizedPath}`;
}

function readTrimmedBodyField(request: Request, field: "email" | "tenantId"): string | null {
  if (!request.body || typeof request.body !== "object") {
    return null;
  }

  const value = (request.body as Record<string, unknown>)[field];
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function logRateLimitExceeded(request: Request, scope: RateLimitScope): void {
  logger.warn(
    {
      endpoint: resolveEndpointKey(request),
      ipAddress: request.ip ?? request.header("x-forwarded-for") ?? null,
      organizationId: request.context.organizationId,
      requestId: request.context.requestId,
      scope,
      sessionId: request.context.sessionId,
      tenantId: request.context.tenantId,
      userId: request.context.userId
    },
    "Rate limit exceeded"
  );
}

async function recordBruteForceAlert(request: Request): Promise<void> {
  const tenantReference = readTrimmedBodyField(request, "tenantId");
  const email = readTrimmedBodyField(request, "email");

  if (!tenantReference || !email) {
    return;
  }

  const membership = await prisma.membership.findFirst({
    select: {
      organizationId: true,
      tenantId: true,
      userId: true
    },
    where: {
      organization: {
        OR: [{ id: tenantReference }, { slug: tenantReference }, { tenantId: tenantReference }]
      },
      status: MembershipStatus.ACTIVE,
      user: {
        email: {
          equals: email,
          mode: "insensitive"
        }
      }
    }
  });

  if (!membership) {
    return;
  }

  await prisma.loginAlert.create({
    data: {
      ipAddress: request.ip ?? request.header("x-forwarded-for") ?? null,
      organizationId: membership.organizationId,
      tenantId: membership.tenantId,
      userAgent: request.header("user-agent") ?? null,
      userId: membership.userId
    }
  });
}

function buildRateLimitError(
  request: Request,
  response: Response,
  input: {
    detail: string;
    retryAfterSeconds: number;
  }
): void {
  response.setHeader("Retry-After", String(input.retryAfterSeconds));
  response.status(429).json(
    toProblemDetails(
      request,
      new ProblemDetailsError({
        detail: input.detail,
        status: 429,
        title: "Too Many Requests"
      })
    )
  );
}

function setStandardRateLimitHeaders(
  response: Response,
  input: {
    limit: number;
    remaining: number;
    retryAfterSeconds: number;
  }
): void {
  response.setHeader("RateLimit-Limit", String(input.limit));
  response.setHeader("RateLimit-Remaining", String(Math.max(0, input.remaining)));
  response.setHeader("RateLimit-Reset", String(input.retryAfterSeconds));
}

function resolveIpKey(request: Request): string {
  const rawIp = request.ip ?? request.header("x-forwarded-for") ?? "anonymous";
  return rawIp.trim().toLowerCase().replace(/[^a-z0-9:.,_-]/gi, "_");
}

function resolveAuthenticatedKey(request: Request): string {
  const endpoint = resolveEndpointKey(request);

  if (request.context.apiKeyId) {
    return `api-key:${request.context.apiKeyId}:endpoint:${endpoint}`;
  }

  if (request.context.tenantId && request.context.userId) {
    return `tenant:${request.context.tenantId}:user:${request.context.userId}:endpoint:${endpoint}`;
  }

  if (request.context.tenantId) {
    return `tenant:${request.context.tenantId}:ip:${resolveIpKey(request)}:endpoint:${endpoint}`;
  }

  return `ip:${resolveIpKey(request)}:endpoint:${endpoint}`;
}

async function consumeFixedWindow(input: {
  key: string;
  redis: Redis;
  scope: RateLimitScope;
  windowMs: number;
}): Promise<{
  count: number;
  retryAfterSeconds: number;
  storageKey: string;
}> {
  const now = Date.now();
  const currentWindow = Math.floor(now / input.windowMs);
  const remainingWindowMs = Math.max(1, input.windowMs - (now % input.windowMs));
  const storageKey = `rate_limit:${input.scope}:${currentWindow}:${input.key}`;
  const pipelineResult = await input.redis.multi().incr(storageKey).pexpire(storageKey, remainingWindowMs).exec();

  if (!pipelineResult || pipelineResult.length === 0) {
    throw new Error("RATE_LIMIT_BACKEND_UNAVAILABLE");
  }

  const count = Number(pipelineResult[0]?.[1] ?? NaN);
  if (!Number.isFinite(count)) {
    throw new Error("RATE_LIMIT_BACKEND_INVALID_RESPONSE");
  }

  return {
    count,
    retryAfterSeconds: Math.max(1, Math.ceil(remainingWindowMs / 1000)),
    storageKey
  };
}

function consumeFixedWindowInMemory(input: {
  key: string;
  scope: RateLimitScope;
  windowMs: number;
}): {
  count: number;
  retryAfterSeconds: number;
  storageKey: string;
} {
  const now = Date.now();
  const currentWindow = Math.floor(now / input.windowMs);
  const remainingWindowMs = Math.max(1, input.windowMs - (now % input.windowMs));
  const storageKey = `rate_limit:${input.scope}:${currentWindow}:${input.key}`;
  const current = memoryRateLimitStore.get(storageKey);

  if (!current || current.expiresAt <= now) {
    memoryRateLimitStore.set(storageKey, {
      count: 1,
      expiresAt: now + remainingWindowMs
    });

    return {
      count: 1,
      retryAfterSeconds: Math.max(1, Math.ceil(remainingWindowMs / 1000)),
      storageKey
    };
  }

  current.count += 1;
  current.expiresAt = now + remainingWindowMs;
  memoryRateLimitStore.set(storageKey, current);

  return {
    count: current.count,
    retryAfterSeconds: Math.max(1, Math.ceil((current.expiresAt - now) / 1000)),
    storageKey
  };
}

async function releaseSuccessfulRequest(redis: Redis | null, storageKey: string): Promise<void> {
  if (!redis) {
    const current = memoryRateLimitStore.get(storageKey);
    if (!current) {
      return;
    }

    current.count = Math.max(0, current.count - 1);
    if (current.count === 0) {
      memoryRateLimitStore.delete(storageKey);
      return;
    }

    memoryRateLimitStore.set(storageKey, current);
    return;
  }

  try {
    await redis.decr(storageKey);
  } catch (error) {
    logger.error(
      {
        error,
        storageKey
      },
      "Failed to release successful rate-limit reservation"
    );
  }
}

function createDistributedRateLimitMiddleware(
  config: ApiConfig,
  input: {
    detail: string | ((request: Request) => string);
    keyGenerator: (request: Request) => string;
    limit: number | ((request: Request) => number);
    scope: RateLimitScope;
    skipSuccessfulRequests?: boolean;
    windowMs: number;
  }
): RequestHandler {
  const useInMemoryStore = config.NODE_ENV === "test";
  let redis: Redis | null = null;

  return (request, response, next) => {
    void (async () => {
      try {
        const limit =
          typeof input.limit === "function" ? input.limit(request) : input.limit;
        const consumed = useInMemoryStore
          ? consumeFixedWindowInMemory({
              key: input.keyGenerator(request),
              scope: input.scope,
              windowMs: input.windowMs
            })
          : await consumeFixedWindow({
              key: input.keyGenerator(request),
              redis: redis ?? (redis = getSharedRedis(config)),
              scope: input.scope,
              windowMs: input.windowMs
            });
        const remaining = Math.max(0, limit - consumed.count);
        setStandardRateLimitHeaders(response, {
          limit,
          remaining,
          retryAfterSeconds: consumed.retryAfterSeconds
        });

        if (consumed.count > limit) {
          logRateLimitExceeded(request, input.scope);
          if (input.scope === "login") {
            void recordBruteForceAlert(request);
          }

          buildRateLimitError(request, response, {
            detail:
              typeof input.detail === "function" ? input.detail(request) : input.detail,
            retryAfterSeconds: consumed.retryAfterSeconds
          });
          return;
        }

        if (input.skipSuccessfulRequests) {
          response.on("finish", () => {
            if (response.statusCode < 400) {
              void releaseSuccessfulRequest(redis, consumed.storageKey);
            }
          });
        }

        next();
      } catch (error) {
        logger.error(
          {
            endpoint: resolveEndpointKey(request),
            error,
            requestId: request.context.requestId,
            scope: input.scope,
            tenantId: request.context.tenantId,
            userId: request.context.userId
          },
          "Distributed rate-limit backend failed"
        );
        next(
          new ProblemDetailsError({
            detail: "Rate-limiting backend is unavailable.",
            status: 503,
            title: "Service Unavailable"
          })
        );
      }
    })();
  };
}

export function createRateLimitMiddleware(config: ApiConfig): RequestHandler {
  return createDistributedRateLimitMiddleware(config, {
    detail: (request) =>
      request.context.apiKeyId
        ? "Too many requests for this API key. Please retry later."
        : "Too many requests from this IP address. Please retry later.",
    keyGenerator: resolveAuthenticatedKey,
    limit: (request) =>
      request.context.apiKeyId ? config.API_KEY_RATE_LIMIT_MAX : config.API_RATE_LIMIT_MAX,
    scope: "api",
    windowMs: config.API_RATE_LIMIT_WINDOW_MS
  });
}

export function createLoginRateLimitMiddleware(config: ApiConfig): RequestHandler {
  return createDistributedRateLimitMiddleware(config, {
    detail: "Too many login attempts from this IP address. Please retry later.",
    keyGenerator: (request) => {
      const email = readTrimmedBodyField(request, "email")?.toLowerCase() ?? "unknown-email";
      const tenantReference =
        readTrimmedBodyField(request, "tenantId")?.toLowerCase() ?? "unknown-tenant";

      return `login:${tenantReference}:${email}:${resolveIpKey(request)}`;
    },
    limit: config.API_LOGIN_RATE_LIMIT_MAX,
    scope: "login",
    skipSuccessfulRequests: true,
    windowMs: config.API_LOGIN_RATE_LIMIT_WINDOW_MS
  });
}

export function createWebhookRateLimitMiddleware(config: ApiConfig): RequestHandler {
  return createDistributedRateLimitMiddleware(config, {
    detail: "Inbound webhook traffic temporarily rate limited for this route.",
    keyGenerator: (request) => {
      const tenantId = request.context.tenantId ?? "public";
      const signature =
        request.header("stripe-signature") ??
        request.header("x-birthhub-signature") ??
        "unsigned";

      return `webhook:${tenantId}:${resolveEndpointKey(request)}:${signature}:${resolveIpKey(request)}`;
    },
    limit: (request) =>
      request.context.tenantId
        ? config.API_WEBHOOK_RATE_LIMIT_MAX * config.API_WEBHOOK_RATE_LIMIT_TENANT_MULTIPLIER
        : config.API_WEBHOOK_RATE_LIMIT_MAX,
    scope: "webhook",
    windowMs: config.API_WEBHOOK_RATE_LIMIT_WINDOW_MS
  });
}
