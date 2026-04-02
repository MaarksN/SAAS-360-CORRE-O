import { randomUUID } from "node:crypto";

import type { Role } from "@birthub/database";
import { getActiveTraceContext, runWithLogContext } from "@birthub/logger";
import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

export interface RequestContext {
  apiKeyId: string | null;
  authType: "api-key" | "session" | null;
  billingPlanStatus:
    | {
        code?: string;
        hardLocked?: boolean;
        limits?: Record<string, unknown>;
        status?: string | null;
      }
    | null;
  organizationId: string | null;
  requestId: string;
  role: Role | null;
  sessionId: string | null;
  tenantId: string | null;
  tenantSlug: string | null;
  traceId: string;
  userId: string | null;
}

function readTraceIdFromTraceparent(traceparent: string | undefined): string | null {
  if (!traceparent) {
    return null;
  }

  const parts = traceparent.split("-");
  if (parts.length < 4) {
    return null;
  }

  return parts[1]?.trim() || null;
}

// ADR-007: tenant identity is bound at the edge and propagated immutably through the request lifecycle.
export function requestContextMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
): void {
  const requestId = request.header("x-request-id") ?? randomUUID();
  const activeTrace = getActiveTraceContext();
  const traceId =
    request.header("x-trace-id") ??
    readTraceIdFromTraceparent(request.header("traceparent") ?? undefined) ??
    activeTrace?.traceId ??
    requestId;

  request.context = {
    apiKeyId: null,
    authType: null,
    billingPlanStatus: null,
    organizationId: null,
    requestId,
    role: null,
    sessionId: null,
    tenantId: null,
    tenantSlug: null,
    traceId,
    userId: null
  };

  response.setHeader("x-request-id", requestId);
  response.setHeader("x-trace-id", traceId);

  runWithLogContext(request.context, () => {
    next();
  });
}
