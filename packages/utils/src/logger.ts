import {
  createLogger as createStructuredLogger,
  getLogContext,
  runWithLogContext,
  updateLogContext
} from "@birthub/logger";

export interface LegacyLogger {
  debug: (message: string, context?: unknown) => void;
  error: (message: string, context?: unknown) => void;
  info: (message: string, context?: unknown) => void;
  raw: ReturnType<typeof createStructuredLogger>;
  warn: (message: string, context?: unknown) => void;
}

const rawLogger = createStructuredLogger("utils");

function emit(level: "debug" | "error" | "info" | "warn", message: string, context?: unknown): void {
  const logMethod = rawLogger[level].bind(rawLogger) as (...args: unknown[]) => void;

  if (context instanceof Error) {
    logMethod(
      {
        err: context,
        errorName: context.name
      },
      message
    );
    return;
  }

  if (context && typeof context === "object") {
    logMethod(context, message);
    return;
  }

  if (context !== undefined) {
    logMethod({ context }, message);
    return;
  }

  logMethod(message);
}

export const logger: LegacyLogger = {
  debug: (message, context) => {
    emit("debug", message, context);
  },
  error: (message, context) => {
    emit("error", message, context);
  },
  info: (message, context) => {
    emit("info", message, context);
  },
  raw: rawLogger,
  warn: (message, context) => {
    emit("warn", message, context);
  }
};

export const createLogger = createStructuredLogger;
export { getLogContext, runWithLogContext, updateLogContext };
