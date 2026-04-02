import type { ApiConfig } from "@birthub/config";
import { healthResponseSchema } from "@birthub/config";
import { pingDatabase, pingDatabaseDeep } from "@birthub/database";

import { pingRedis } from "./queue.js";

const READINESS_MAX_LATENCY_MS = 750;
const DEEP_HEALTH_MAX_LATENCY_MS = 2_000;
const EXTERNAL_MAX_LATENCY_MS = 1_500;

type DependencyProbeResult = {
  latencyMs: number;
  message?: string;
  name?: string;
  status: "up" | "down";
  strict: boolean;
  thresholdMs: number;
};

type HealthResponse = ReturnType<typeof healthResponseSchema.parse>;

async function pingExternalDependency(url: string): Promise<{ name: string; status: "up" | "down" }> {
  const name = new URL(url).hostname;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(1500)
    });

    return {
      name,
      status: response.ok ? "up" : "down"
    };
  } catch {
    return {
      name,
      status: "down"
    };
  }
}

async function measureDependency(
  probe: () => Promise<{ message?: string; status: "up" | "down" }>,
  options: {
    name?: string;
    strict: boolean;
    thresholdMs: number;
  }
): Promise<DependencyProbeResult> {
  const startedAt = Date.now();
  const result = await probe();
  const latencyMs = Date.now() - startedAt;
  const latencyExceeded = latencyMs > options.thresholdMs;
  const messages = [result.message];

  if (latencyExceeded) {
    messages.push(`latency ${latencyMs}ms exceeded ${options.thresholdMs}ms`);
  }

  return {
    ...(messages.filter(Boolean).length > 0
      ? {
          message: messages.filter(Boolean).join("; ")
        }
      : {}),
    ...(options.name ? { name: options.name } : {}),
    latencyMs,
    status: result.status === "up" && !latencyExceeded ? "up" : "down",
    strict: options.strict,
    thresholdMs: options.thresholdMs
  };
}

function finalizeHealthResponse(input: {
  database: DependencyProbeResult;
  externalDependencies: DependencyProbeResult[];
  mode: "deep" | "liveness" | "readiness";
  redis: DependencyProbeResult;
}): HealthResponse {
  const strictDependencies = [
    input.database,
    input.redis,
    ...input.externalDependencies.filter((dependency) => dependency.strict)
  ];
  const status =
    strictDependencies.every((dependency) => dependency.status === "up") ? "ok" : "degraded";

  return healthResponseSchema.parse({
    checkedAt: new Date().toISOString(),
    mode: input.mode,
    services: {
      database: input.database,
      externalDependencies: input.externalDependencies,
      redis: input.redis
    },
    status
  });
}

export function createHealthService(config: ApiConfig) {
  return async (): Promise<HealthResponse> => {
    const [database, redis, externalDependencies] = await Promise.all([
      measureDependency(() => pingDatabase(), {
        strict: true,
        thresholdMs: READINESS_MAX_LATENCY_MS
      }),
      measureDependency(() => pingRedis(config), {
        strict: true,
        thresholdMs: READINESS_MAX_LATENCY_MS
      }),
      Promise.all(
        config.externalHealthcheckUrls.map((url) =>
          measureDependency(
            () => pingExternalDependency(url).then(({ status }) => ({ status })),
            {
              name: new URL(url).hostname,
              strict: false,
              thresholdMs: EXTERNAL_MAX_LATENCY_MS
            }
          )
        )
      )
    ]);

    return finalizeHealthResponse({
      database,
      externalDependencies,
      mode: "liveness",
      redis
    });
  };
}

export function createDeepHealthService(config: ApiConfig) {
  return async (): Promise<HealthResponse> => {
    const [database, redis, externalDependencies] = await Promise.all([
      measureDependency(() => pingDatabaseDeep(), {
        strict: true,
        thresholdMs: DEEP_HEALTH_MAX_LATENCY_MS
      }),
      measureDependency(() => pingRedis(config), {
        strict: true,
        thresholdMs: READINESS_MAX_LATENCY_MS
      }),
      Promise.all(
        config.externalHealthcheckUrls.map((url) =>
          measureDependency(
            () => pingExternalDependency(url).then(({ status }) => ({ status })),
            {
              name: new URL(url).hostname,
              strict: false,
              thresholdMs: EXTERNAL_MAX_LATENCY_MS
            }
          )
        )
      )
    ]);

    return finalizeHealthResponse({
      database,
      externalDependencies,
      mode: "deep",
      redis
    });
  };
}

export function createReadinessHealthService(config: ApiConfig) {
  return async (): Promise<HealthResponse> => {
    const [database, redis, externalDependencies] = await Promise.all([
      measureDependency(() => pingDatabase(), {
        strict: true,
        thresholdMs: READINESS_MAX_LATENCY_MS
      }),
      measureDependency(() => pingRedis(config), {
        strict: true,
        thresholdMs: READINESS_MAX_LATENCY_MS
      }),
      Promise.all(
        config.externalHealthcheckUrls.map((url) =>
          measureDependency(
            () => pingExternalDependency(url).then(({ status }) => ({ status })),
            {
              name: new URL(url).hostname,
              strict: false,
              thresholdMs: EXTERNAL_MAX_LATENCY_MS
            }
          )
        )
      )
    ]);

    return finalizeHealthResponse({
      database,
      externalDependencies,
      mode: "readiness",
      redis
    });
  };
}
