import { createHash } from "node:crypto";

import type { AgentManifest } from "@birthub/agents-core";

import { parseAgentConfig } from "./service.config.js";
import type {
  AgentExecutionRecord,
  AgentRecord,
  InstalledAgentSnapshot
} from "./service.types.js";

export function buildPayloadHash(payload: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function canFallbackDatabase(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "PrismaClientInitializationError" ||
    error.name === "PrismaClientRustPanicError" ||
    /DATABASE_URL/i.test(error.message)
  );
}

function flattenTags(manifest: AgentManifest): string[] {
  return Array.from(
    new Set(
      [
        ...manifest.tags.domain,
        ...manifest.tags.industry,
        ...manifest.tags.level,
        ...manifest.tags.persona,
        ...manifest.tags["use-case"]
      ].map((tag) => tag.trim())
    )
  );
}

function mapExecutionStatus(status: string): "FAILED" | "RUNNING" | "SUCCESS" {
  if (status === "FAILED") {
    return "FAILED";
  }

  if (status === "RUNNING" || status === "WAITING_APPROVAL") {
    return "RUNNING";
  }

  return "SUCCESS";
}

function extractDurationMs(input: {
  completedAt: Date | null;
  startedAt: Date;
}): number {
  if (!input.completedAt) {
    return 0;
  }

  return Math.max(0, input.completedAt.getTime() - input.startedAt.getTime());
}

export function extractLogs(metadata: unknown): string[] {
  if (!metadata || typeof metadata !== "object") {
    return [];
  }

  const logs = (metadata as { logs?: unknown }).logs;
  return Array.isArray(logs)
    ? logs.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

export function extractPayloadHash(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const candidate = (metadata as { payloadHash?: unknown }).payloadHash;
  return typeof candidate === "string" ? candidate : null;
}

export function extractExecutionMode(
  execution: AgentExecutionRecord
): "DRY_RUN" | "LIVE" | "UNKNOWN" {
  if (execution.output && typeof execution.output === "object") {
    const candidate = (execution.output as { executionMode?: unknown }).executionMode;
    if (candidate === "DRY_RUN" || candidate === "LIVE") {
      return candidate;
    }
  }

  if (execution.metadata && typeof execution.metadata === "object") {
    const candidate = (execution.metadata as { dryRun?: unknown }).dryRun;
    if (candidate === true) {
      return "DRY_RUN";
    }

    const runtimeProvider = (execution.metadata as { runtimeProvider?: unknown }).runtimeProvider;
    if (typeof runtimeProvider === "string") {
      return "LIVE";
    }
  }

  return "UNKNOWN";
}

export function buildSnapshot(input: {
  agent: AgentRecord;
  executions: AgentExecutionRecord[];
  manifest: AgentManifest;
}): InstalledAgentSnapshot {
  const config = parseAgentConfig(input.agent.config);
  const executions = input.executions.map((execution) => ({
    durationMs: extractDurationMs({
      completedAt: execution.completedAt,
      startedAt: execution.startedAt
    }),
    id: execution.id,
    mode: extractExecutionMode(execution),
    startedAt: execution.startedAt.toISOString(),
    status: mapExecutionStatus(execution.status)
  }));
  const failedExecutions = executions.filter((execution) => execution.status === "FAILED").length;
  const latestExecution = input.executions[0] ?? null;

  return {
    catalogAgentId: input.manifest.agent.id,
    connectors: config.connectors,
    executionCount: executions.length,
    executions,
    failRate: executions.length > 0 ? failedExecutions / executions.length : 0,
    id: input.agent.id,
    keywords: input.manifest.keywords,
    lastRun: latestExecution ? latestExecution.startedAt.toISOString() : null,
    logs: latestExecution ? extractLogs(latestExecution.metadata).slice(0, 12) : [],
    manifest: input.manifest,
    name: input.agent.name,
    runtimeProvider: config.runtimeProvider,
    sourceStatus: input.agent.status,
    status: config.status,
    tags: flattenTags(input.manifest),
    version: config.installedVersion
  };
}
