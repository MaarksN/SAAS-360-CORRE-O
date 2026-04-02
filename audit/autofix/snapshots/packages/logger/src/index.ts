import { AsyncLocalStorage } from "node:async_hooks";

import pino, { transport, type DestinationStream, type Logger, type LoggerOptions } from "pino";

import { getActiveTraceContext } from "./otel.js";

export interface LogContext {
  jobId?: string | null;
  operation?: string | null;
  requestId?: string | null;
  spanId?: string | null;
  tenantId?: string | null;
  traceId?: string | null;
  userId?: string | null;
}

const logContextStore = new AsyncLocalStorage<LogContext>();
let prettyTransport: DestinationStream | null = null;

function normalizeContext(context: LogContext): Required<LogContext> {
  const activeTrace = getActiveTraceContext();
  const traceId = context.traceId ?? activeTrace?.traceId ?? context.requestId ?? null;
  const spanId = context.spanId ?? activeTrace?.spanId ?? null;

  return {
    jobId: context.jobId ?? null,
    operation: context.operation ?? null,
    requestId: context.requestId ?? null,
    spanId,
    tenantId: context.tenantId ?? null,
    traceId,
    userId: context.userId ?? null
  };
}

const sensitivePaths = [
  "authorization",
  "context.authorization",
  "context.csrfToken",
  "context.email",
  "context.password",
  "context.refreshToken",
  "context.secret",
  "context.sessionId",
  "context.session_id",
  "context.token",
  "cookie",
  "csrfToken",
  "email",
  "headers.authorization",
  "headers.cookie",
  "password",
  "refreshToken",
  "secret",
  "sessionId",
  "session_id",
  "token"
];

function parseSampleRate(): number {
  const raw = Number(process.env.LOG_SAMPLE_RATE ?? "1");
  if (!Number.isFinite(raw)) {
    return 1;
  }

  return Math.max(0, Math.min(1, raw));
}

function shouldSample(level: number): boolean {
  if (level >= 50) {
    return false;
  }

  const rate = parseSampleRate();
  if (rate >= 1) {
    return false;
  }

  if (rate <= 0) {
    return true;
  }

  return Math.random() > rate;
}

function getPrettyTransport(): DestinationStream {
  if (prettyTransport) {
    return prettyTransport;
  }

  prettyTransport = transport({
    options: {
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "SYS:standard"
    },
    target: "pino-pretty"
  });

  return prettyTransport;
}

export function getLogContext(): Required<LogContext> {
  return normalizeContext(logContextStore.getStore() ?? {});
}

export function runWithLogContext<T>(context: LogContext, callback: () => T): T {
  const current = getLogContext();
  return logContextStore.run(
    normalizeContext({
      ...current,
      ...context
    }),
    callback
  );
}

export function updateLogContext(context: LogContext): void {
  const current = getLogContext();
  logContextStore.enterWith(
    normalizeContext({
      ...current,
      ...context
    })
  );
}

export function createLogger(service: string, options?: LoggerOptions): Logger {
  const isProduction = process.env.NODE_ENV === "production";
  const shouldPrettyPrint = !isProduction && process.env.NODE_ENV !== "test";
  const loggerOptions: LoggerOptions = {
    ...options,
    base: {
      environment: process.env.NODE_ENV ?? "development",
      service
    },
    formatters: {
      level: (label) => ({
        level: label
      })
    },
    hooks: {
      logMethod(args, method, level) {
        if (shouldSample(level)) {
          return;
        }

        return (method as (...values: unknown[]) => void).apply(this, args as unknown[]);
      }
    },
    level: process.env.LOG_LEVEL ?? "info",
    messageKey: "message",
    mixin: () => {
      const context = getLogContext();
      const trace = getActiveTraceContext();
      const traceId = context.traceId ?? trace?.traceId ?? context.requestId ?? null;
      const spanId = context.spanId ?? trace?.spanId ?? null;

      return {
        jobId: context.jobId,
        job_id: context.jobId,
        operation: context.operation,
        requestId: context.requestId,
        request_id: context.requestId,
        spanId,
        span_id: spanId,
        tenantId: context.tenantId,
        tenant_id: context.tenantId,
        traceId,
        trace_id: traceId,
        userId: context.userId,
        user_id: context.userId
      };
    },
    redact: {
      censor: "[REDACTED]",
      paths: sensitivePaths
    },
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`
  };

  if (options?.transport) {
    return pino(loggerOptions);
  }

  if (shouldPrettyPrint) {
    return pino(loggerOptions, getPrettyTransport());
  }

  return pino(loggerOptions);
}

export * from "./metrics.js";
export * from "./otel.js";
