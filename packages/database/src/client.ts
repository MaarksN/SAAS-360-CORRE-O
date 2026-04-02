import { randomUUID } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

import { PrismaQueryTimeoutError } from "./errors/prisma-query-timeout.error.js";
import { requireTenantId } from "./tenant-context.js";

const QUERY_TIMEOUT_MS = 5_000;
const DEFAULT_DATABASE_CONNECTION_LIMIT = 10;
const DEFAULT_DEVELOPMENT_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/birthub?schema=public";
const DEFAULT_SLOW_QUERY_MS = 750;

const globalForPrisma = globalThis as typeof globalThis & {
  birthubPrisma?: PrismaClient;
};

type MetricLabels = Record<string, string | number | boolean | null | undefined>;

type GlobalMetricsApi = {
  incrementCounter: (
    name: string,
    labels?: MetricLabels,
    amount?: number,
    help?: string
  ) => void;
  observeHistogram: (
    name: string,
    value: number,
    labels?: MetricLabels,
    options?: {
      buckets?: number[];
      help?: string;
    }
  ) => void;
  setGauge: (name: string, value: number, labels?: MetricLabels, help?: string) => void;
};

const globalMetrics = globalThis as typeof globalThis & {
  __birthubMetricsApi?: GlobalMetricsApi;
};

function getMetricsApi(): GlobalMetricsApi | null {
  return globalMetrics.__birthubMetricsApi ?? null;
}

function raceWithTimeout<T>(
  promise: Promise<T>,
  operation: string,
  model?: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const timer = setTimeout(() => {
        reject(new PrismaQueryTimeoutError(operation, QUERY_TIMEOUT_MS, model));
      }, QUERY_TIMEOUT_MS);

      void promise.finally(() => {
        clearTimeout(timer);
      });
    })
  ]);
}

function resolveConnectionLimit(databaseUrl: string): number {
  const explicit = Number(process.env.DATABASE_CONNECTION_LIMIT ?? "");
  if (Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }

  try {
    const parsed = new URL(databaseUrl);
    const raw = Number(parsed.searchParams.get("connection_limit") ?? "");
    if (Number.isFinite(raw) && raw > 0) {
      return raw;
    }
  } catch {
    // Ignore malformed URLs and fall back to the default.
  }

  return DEFAULT_DATABASE_CONNECTION_LIMIT;
}

function resolveSlowQueryThresholdMs(): number {
  const raw = Number(process.env.DB_SLOW_QUERY_MS ?? "");
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_SLOW_QUERY_MS;
}

const slowQueryThresholdMs = resolveSlowQueryThresholdMs();
let activeQueries = 0;

function updateDatabaseGauges(connectionLimit: number): void {
  const metrics = getMetricsApi();
  if (!metrics) {
    return;
  }

  metrics.setGauge(
    "birthub_db_active_queries",
    activeQueries,
    {},
    "Current number of active Prisma queries."
  );
  metrics.setGauge(
    "birthub_db_connection_pool_usage_ratio",
    connectionLimit > 0 ? activeQueries / connectionLimit : 0,
    {},
    "Approximate database connection pool usage ratio."
  );
}

function resolveRuntimeDatabaseUrl(rawUrl: string | undefined): string {
  if (rawUrl?.trim()) {
    return rawUrl;
  }

  const nodeEnv = process.env.NODE_ENV ?? "development";
  if (nodeEnv === "development" || nodeEnv === "test") {
    return DEFAULT_DEVELOPMENT_DATABASE_URL;
  }

  throw new Error(
    "DATABASE_URL environment variable must be set for Prisma in non-development environments."
  );
}

function createPrismaAdapter(databaseUrl: string, connectionLimit: number): PrismaPg {
  const parsed = new URL(databaseUrl);
  const schema = parsed.searchParams.get("schema") ?? undefined;

  parsed.searchParams.delete("connection_limit");
  parsed.searchParams.delete("pgbouncer");
  parsed.searchParams.delete("schema");

  return new PrismaPg(
    {
      connectionString: parsed.toString(),
      max: connectionLimit
    },
    schema ? { schema } : undefined
  );
}

export function createPrismaClient(options: { databaseUrl?: string } = {}): PrismaClient {
  const runtimeDatabaseUrl = resolveRuntimeDatabaseUrl(
    options.databaseUrl ?? process.env.DATABASE_URL
  );
  const normalizedDatabaseUrl =
    normalizeDatabaseUrl(runtimeDatabaseUrl) ?? runtimeDatabaseUrl;
  const connectionLimit = resolveConnectionLimit(normalizedDatabaseUrl);

  if (options.databaseUrl === undefined) {
    process.env.DATABASE_URL = normalizedDatabaseUrl;
  }

  const baseClient = new PrismaClient({
    adapter: createPrismaAdapter(normalizedDatabaseUrl, connectionLimit),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

  return baseClient.$extends({
    name: "birthub-query-observability",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const metrics = getMetricsApi();
          const queryModel = model ?? "raw";
          const startedAt = Date.now();

          activeQueries += 1;
          updateDatabaseGauges(connectionLimit);

          try {
            const result = await raceWithTimeout(query(args), operation, model);
            const durationMs = Date.now() - startedAt;

            if (metrics) {
              metrics.incrementCounter(
                "birthub_db_queries_total",
                {
                  model: queryModel,
                  operation,
                  outcome: "success"
                },
                1,
                "Total database queries grouped by model, operation and outcome."
              );
              metrics.observeHistogram(
                "birthub_db_query_duration_ms",
                durationMs,
                {
                  model: queryModel,
                  operation
                },
                {
                  help: "Database query latency in milliseconds."
                }
              );
              if (durationMs >= slowQueryThresholdMs) {
                metrics.incrementCounter(
                  "birthub_db_slow_queries_total",
                  {
                    model: queryModel,
                    operation
                  },
                  1,
                  "Total slow database queries grouped by model and operation."
                );
              }
            }

            return result;
          } catch (error) {
            const durationMs = Date.now() - startedAt;

            if (metrics) {
              metrics.incrementCounter(
                "birthub_db_queries_total",
                {
                  model: queryModel,
                  operation,
                  outcome: "error"
                },
                1,
                "Total database queries grouped by model, operation and outcome."
              );
              metrics.observeHistogram(
                "birthub_db_query_duration_ms",
                durationMs,
                {
                  model: queryModel,
                  operation
                },
                {
                  help: "Database query latency in milliseconds."
                }
              );
            }

            throw error;
          } finally {
            activeQueries = Math.max(0, activeQueries - 1);
            updateDatabaseGauges(connectionLimit);
          }
        }
      }
    }
  }) as PrismaClient;
}

function normalizeDatabaseUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl?.trim()) {
    return rawUrl;
  }

  try {
    const parsed = new URL(rawUrl);

    if (!parsed.protocol.startsWith("postgres")) {
      return rawUrl;
    }

    if (!parsed.searchParams.has("pgbouncer")) {
      parsed.searchParams.set("pgbouncer", "true");
    }

    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set(
        "connection_limit",
        String(
          Number(process.env.DATABASE_CONNECTION_LIMIT ?? DEFAULT_DATABASE_CONNECTION_LIMIT)
        )
      );
    }

    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

export const prisma = globalForPrisma.birthubPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.birthubPrisma = prisma;
}

// @see ADR-008
export async function withTenantDatabaseContext<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  client: PrismaClient = prisma
): Promise<T> {
  const tenantId = requireTenantId("database transaction");

  return client.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
    return callback(tx);
  });
}

export async function pingDatabase(): Promise<{ status: "up" | "down"; message?: string }> {
  try {
    await raceWithTimeout(prisma.$queryRaw`SELECT 1`, "$queryRaw");
    return { status: "up" };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Unknown database error",
      status: "down"
    };
  }
}

export async function pingDatabaseDeep(): Promise<{ status: "up" | "down"; message?: string }> {
  const startedAt = Date.now();

  try {
    const probe = await prisma.billingEvent.create({
      data: {
        payload: {
          probe: true
        },
        stripeEventId: `evt_health_${randomUUID()}`,
        type: "health.deep.probe"
      }
    });

    await prisma.billingEvent.delete({
      where: {
        id: probe.id
      }
    });

    return {
      message: `rw-ok:${Date.now() - startedAt}ms`,
      status: "up"
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Unknown deep database error",
      status: "down"
    };
  }
}
