import type { ApiConfig } from "@birthub/config";
import { createLogger } from "@birthub/logger";
import cors from "cors";
import express from "express";
import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import helmet from "helmet";

import {
  configureCacheStore,
  registerTenantCacheInvalidationMiddleware
} from "../common/cache/index.js";
import { openApiDocument } from "../docs/openapi.js";
import {
  createDeepHealthService,
  createHealthService,
  createReadinessHealthService
} from "../lib/health.js";
import { asyncHandler, ProblemDetailsError } from "../lib/problem-details.js";
import { contentTypeMiddleware } from "../middleware/content-type.js";
import { csrfProtection } from "../middleware/csrf.js";
import { globalErrorHandler, notFoundMiddleware } from "../middleware/error-handler.js";
import { authenticationMiddleware } from "../middleware/authentication.js";
import { originValidationMiddleware } from "../middleware/origin-check.js";
import {
  createRateLimitMiddleware,
  createWebhookRateLimitMiddleware
} from "../middleware/rate-limit.js";
import { metricsHandler, metricsMiddleware } from "../metrics.js";
import { requestContextMiddleware } from "../middleware/request-context.js";
import { sanitizeMutationInput } from "../middleware/sanitize-input.js";
import { tenantContextMiddleware } from "../middleware/tenant-context.js";
import { startOutputRetentionScheduler } from "../modules/outputs/output-retention.js";
import { initializeWorkflowInternalEventBridge } from "../modules/webhooks/index.js";
import { createStripeWebhookRouter } from "../modules/webhooks/stripe.router.js";

const requestLogger = createLogger("api-http");

function buildCorsOptions(config: ApiConfig): cors.CorsOptions {
  return {
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(
        new ProblemDetailsError({
          detail: `Origin '${origin}' is not present in the API allowlist.`,
          status: 403,
          title: "Forbidden"
        })
      );
    }
  };
}

function buildHelmetOptions(): Parameters<typeof helmet>[0] {
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        upgradeInsecureRequests: []
      }
    },
    hsts: {
      includeSubDomains: true,
      maxAge: 31536000,
      preload: true
    }
  };
}

function registerRequestLoggingMiddleware(app: Express): void {
  app.use((request, response, next) => {
    const startedAt = process.hrtime.bigint();

    response.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const payload = {
        durationMs: Number(durationMs.toFixed(2)),
        method: request.method,
        organizationId: request.context.organizationId,
        path: request.originalUrl,
        remoteAddress: request.ip ?? request.header("x-forwarded-for") ?? null,
        requestId: request.context.requestId,
        role: request.context.role,
        statusCode: response.statusCode,
        tenantId: request.context.tenantId,
        traceId: request.context.traceId,
        userId: request.context.userId
      };

      if (response.statusCode >= 500) {
        requestLogger.error(payload, "HTTP request completed with server error");
        return;
      }

      if (response.statusCode >= 400) {
        requestLogger.warn(payload, "HTTP request completed with client error");
        return;
      }

      requestLogger.info(payload, "HTTP request completed");
    });

    next();
  });
}

function registerTimeoutMiddleware(app: Express, config: ApiConfig): void {
  app.use((request, response, next) => {
    request.setTimeout(config.API_HANDLER_TIMEOUT_MS);
    response.setTimeout(config.API_HANDLER_TIMEOUT_MS, () => {
      if (response.headersSent) {
        return;
      }

      next(
        new ProblemDetailsError({
          detail: `Request exceeded ${config.API_HANDLER_TIMEOUT_MS}ms timeout budget.`,
          status: 408,
          title: "Request Timeout"
        })
      );
    });
    next();
  });
}

export function configureAppInfrastructure(app: Express, config: ApiConfig): void {
  configureCacheStore(config.REDIS_URL, config.NODE_ENV);
  if (config.NODE_ENV !== "test") {
    registerTenantCacheInvalidationMiddleware();
    startOutputRetentionScheduler();
  }
  initializeWorkflowInternalEventBridge(config);

  app.disable("x-powered-by");
  app.use(requestContextMiddleware);
  registerRequestLoggingMiddleware(app);
  app.use(authenticationMiddleware(config.API_AUTH_COOKIE_NAME, config));
  app.use(tenantContextMiddleware);
  app.use(helmet(buildHelmetOptions()));
  app.use(cors(buildCorsOptions(config)));

  const stripeWebhookEnabled = Boolean(config.STRIPE_SECRET_KEY && config.STRIPE_WEBHOOK_SECRET);
  if (stripeWebhookEnabled) {
    app.use(
      "/api/webhooks",
      createWebhookRateLimitMiddleware(config),
      createStripeWebhookRouter(config)
    );
  }

  app.use(contentTypeMiddleware);
  registerTimeoutMiddleware(app, config);
  app.use(metricsMiddleware);
  app.use(express.json({ limit: config.API_JSON_BODY_LIMIT }));
  app.use(sanitizeMutationInput);
  app.use(originValidationMiddleware(config.corsOrigins));
  app.use(
    csrfProtection({
      cookieName: config.API_CSRF_COOKIE_NAME,
      headerName: config.API_CSRF_HEADER_NAME
    })
  );
  app.use(createRateLimitMiddleware(config));
}

export function registerOperationalRoutes(
  app: Express,
  config: ApiConfig,
  options: {
    deepHealthService?: ReturnType<typeof createDeepHealthService>;
    healthService?: ReturnType<typeof createHealthService>;
    readinessService?: ReturnType<typeof createReadinessHealthService>;
    shouldExposeDocs: boolean;
  }
): void {
  const healthService = options.healthService ?? createHealthService(config);
  const deepHealthService = options.deepHealthService ?? createDeepHealthService(config);
  const readinessService = options.readinessService ?? createReadinessHealthService(config);

  if (options.shouldExposeDocs) {
    app.get("/api/openapi.json", (_request, response) => {
      response.json(openApiDocument);
    });

    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  }

  app.get(
    "/metrics",
    asyncHandler(async (request, response) => {
      await metricsHandler(request, response);
    })
  );

  app.get(
    "/api/v1/metrics",
    asyncHandler(async (request, response) => {
      await metricsHandler(request, response);
    })
  );

  app.get(
    "/health",
    asyncHandler(async (_request, response) => {
      response.status(200).json(await healthService());
    })
  );

  app.get(
    "/api/v1/health",
    asyncHandler(async (_request, response) => {
      response.status(200).json(await healthService());
    })
  );

  app.get(
    "/health/deep",
    asyncHandler(async (_request, response) => {
      const payload = await deepHealthService();
      response.status(payload.status === "ok" ? 200 : 503).json(payload);
    })
  );

  app.get(
    "/api/v1/health/deep",
    asyncHandler(async (_request, response) => {
      const payload = await deepHealthService();
      response.status(payload.status === "ok" ? 200 : 503).json(payload);
    })
  );

  app.get(
    "/health/readiness",
    asyncHandler(async (_request, response) => {
      const payload = await readinessService();
      response.status(payload.status === "ok" ? 200 : 503).json(payload);
    })
  );

  app.get(
    "/api/v1/health/readiness",
    asyncHandler(async (_request, response) => {
      const payload = await readinessService();
      response.status(payload.status === "ok" ? 200 : 503).json(payload);
    })
  );
}

export function registerGlobalErrorHandling(app: Express): void {
  app.use(notFoundMiddleware);
  app.use(globalErrorHandler);
}
