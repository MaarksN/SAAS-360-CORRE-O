import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(path.join(process.cwd(), "package.json"));

type TraceContext = {
  spanId: string | null;
  traceId: string | null;
};

type SpanApi = {
  addEvent: (name: string, attributes?: Record<string, unknown>) => void;
  recordException: (error: unknown) => void;
  setAttributes: (attributes: Record<string, unknown>) => void;
};

type OtelApi = {
  context: {
    active: () => unknown;
  };
  trace: {
    getSpan: (context: unknown) =>
      | {
          addEvent?: (name: string, attributes?: Record<string, unknown>) => void;
          recordException?: (error: unknown) => void;
          setAttributes?: (attributes: Record<string, unknown>) => void;
          spanContext: () => {
            spanId: string;
            traceId: string;
          };
        }
      | undefined;
    getTracer: (name: string) => {
      startActiveSpan: <T>(
        spanName: string,
        callback: (span: {
          end: () => void;
          recordException?: (error: unknown) => void;
          setAttributes?: (attributes: Record<string, unknown>) => void;
        }) => Promise<T> | T
      ) => Promise<T> | T;
    };
  };
};

function loadOpenTelemetryApi(): OtelApi | null {
  try {
    return require("@opentelemetry/api") as OtelApi;
  } catch {
    return null;
  }
}

function getActiveSpan(): SpanApi | null {
  const otel = loadOpenTelemetryApi();
  if (!otel) {
    return null;
  }

  const span = otel.trace.getSpan(otel.context.active());
  if (!span) {
    return null;
  }

  return {
    addEvent: (name, attributes) => span.addEvent?.(name, attributes),
    recordException: (error) => span.recordException?.(error),
    setAttributes: (attributes) => span.setAttributes?.(attributes)
  };
}

export function getActiveTraceContext(): TraceContext | null {
  const otel = loadOpenTelemetryApi();
  if (!otel) {
    return null;
  }

  const span = otel.trace.getSpan(otel.context.active());
  if (!span) {
    return null;
  }

  const context = span.spanContext();
  return {
    spanId: context.spanId ?? null,
    traceId: context.traceId ?? null
  };
}

export function setActiveSpanAttributes(attributes: Record<string, unknown>): void {
  getActiveSpan()?.setAttributes(attributes);
}

export function addActiveSpanEvent(name: string, attributes?: Record<string, unknown>): void {
  getActiveSpan()?.addEvent(name, attributes);
}

export function recordActiveSpanException(error: unknown): void {
  getActiveSpan()?.recordException(error);
}

export async function withActiveSpan<T>(
  name: string,
  options: {
    attributes?: Record<string, unknown>;
    tracerName?: string;
  },
  callback: () => Promise<T>
): Promise<T> {
  const otel = loadOpenTelemetryApi();
  if (!otel) {
    return callback();
  }

  const tracer = otel.trace.getTracer(options.tracerName ?? "@birthub/logger");
  return tracer.startActiveSpan(name, async (span) => {
    try {
      if (options.attributes) {
        span.setAttributes?.(options.attributes);
      }
      return await callback();
    } catch (error) {
      span.recordException?.(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
