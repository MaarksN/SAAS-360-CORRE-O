import type { NextFunction, Request, Response } from "express";

import { ProblemDetailsError, toProblemDetails } from "../lib/problem-details.js";
import { captureApiException } from "../observability/sentry.js";
import { createLogger, recordActiveSpanException } from "@birthub/logger";

const logger = createLogger("api-error-handler");

export function notFoundMiddleware(request: Request, _response: Response, next: NextFunction): void {
  next(
    new ProblemDetailsError({
      detail: `No route matched '${request.originalUrl}'.`,
      status: 404,
      title: "Not Found"
    })
  );
}

export function globalErrorHandler(
  error: unknown,
  request: Request,
  response: Response,
  next: NextFunction
): void {
  if (response.headersSent) {
    next(error);
    return;
  }

  const errorContext = {
    method: request.method,
    organizationId: request.context?.organizationId,
    path: request.originalUrl,
    requestId: request.context?.requestId,
    role: request.context?.role,
    tenantId: request.context?.tenantId,
    traceId: request.context?.traceId,
    userId: request.context?.userId
  };

  if (error instanceof ProblemDetailsError) {
    if (error.status >= 500) {
      recordActiveSpanException(error);
      captureApiException(error, request);
      logger.error(
        {
          ...errorContext,
          error
        },
        "API request failed with handled server error"
      );
    } else {
      logger.warn(
        {
          ...errorContext,
          error: {
            detail: error.detail,
            status: error.status,
            title: error.title,
            type: error.type
          }
        },
        "API request failed with handled client error"
      );
    }

    response.status(error.status).json(toProblemDetails(request, error));
    return;
  }

  recordActiveSpanException(error);
  captureApiException(error, request);
  logger.error(
    {
      ...errorContext,
      error
    },
    "Unhandled API exception"
  );

  const fallback = new ProblemDetailsError({
    detail: error instanceof Error ? error.message : "Unexpected internal server error.",
    status: 500,
    title: "Internal Server Error"
  });

  response.status(fallback.status).json(toProblemDetails(request, fallback));
}

export const errorHandler = globalErrorHandler;
