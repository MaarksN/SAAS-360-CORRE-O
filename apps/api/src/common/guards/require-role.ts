import type { NextFunction, Request, RequestHandler, Response } from "express";

import { Role } from "@birthub/database";

import { ProblemDetailsError } from "../../lib/problem-details.js";
import { rolePriority } from "../../modules/auth/auth.service.shared.js";

/** @see ADR-011 */
export function RequireRole(minimumRole: Role): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction) => {
    const userId = request.context.userId;
    const organizationId = request.context.organizationId;
    const role = request.context.role;

    if (!userId || !organizationId || !role) {
      next(
        new ProblemDetailsError({
          detail: "Authentication and role are required before role authorization.",
          status: 401,
          title: "Unauthorized"
        })
      );
      return;
    }

    const currentRolePriority = rolePriority(role);
    const requiredRolePriority = rolePriority(minimumRole);

    if (currentRolePriority < requiredRolePriority) {
      next(
        new ProblemDetailsError({
          detail: `Role '${minimumRole}' is required for this operation.`,
          status: 403,
          title: "Forbidden"
        })
      );
      return;
    }

    next();
  };
}

export function requireAuthenticated(request: Request, _response: Response, next: NextFunction): void {
  if (
    !request.context.userId ||
    !request.context.organizationId ||
    !request.context.tenantId
  ) {
    next(
      new ProblemDetailsError({
        detail: "A valid session or API key is required.",
        status: 401,
        title: "Unauthorized"
      })
    );
    return;
  }

  next();
}

export function requireAuthenticatedSession(
  request: Request,
  _response: Response,
  next: NextFunction
): void {
  if (
    request.context.authType !== "session" ||
    !request.context.userId ||
    !request.context.organizationId ||
    !request.context.tenantId ||
    !request.context.sessionId
  ) {
    next(
      new ProblemDetailsError({
        detail: "A valid authenticated session is required.",
        status: 401,
        title: "Unauthorized"
      })
    );
    return;
  }

  next();
}
