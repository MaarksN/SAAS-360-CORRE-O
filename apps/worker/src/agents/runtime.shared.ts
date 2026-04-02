import { existsSync } from "node:fs";
import path from "node:path";

import {
  loadManifestCatalog,
  type ManagedAgentPolicy
} from "@birthub/agents-core";
import { Prisma } from "@birthub/database";

import type {
  AgentConfigSnapshot,
  AuditMemoryPayload,
  RuntimeManifestCatalogEntry
} from "./runtime.types.js";

export const DEFAULT_AGENT_BUDGET_LIMIT_BRL = 100;
export const MINIMUM_APPROVED_LEARNING_CONFIDENCE = 0.7;
export const SHARED_LEARNING_LIMIT = 8;

export function resolveCatalogRoot(): string {
  const candidates = [
    path.join(process.cwd(), "packages", "agent-packs"),
    path.join(process.cwd(), "..", "..", "packages", "agent-packs"),
    path.join(process.cwd(), "..", "packages", "agent-packs")
  ];

  const found = candidates.find((candidate) => existsSync(candidate));

  if (!found) {
    throw new Error("Unable to locate packages/agent-packs directory.");
  }

  return found;
}

let manifestCatalogCache:
  | {
      entries: RuntimeManifestCatalogEntry[];
      loadedAt: number;
    }
  | null = null;

export async function getManifestCatalog(): Promise<RuntimeManifestCatalogEntry[]> {
  const now = Date.now();
  if (manifestCatalogCache && now - manifestCatalogCache.loadedAt < 60_000) {
    return manifestCatalogCache.entries;
  }

  const entries = await loadManifestCatalog(resolveCatalogRoot());
  manifestCatalogCache = {
    entries,
    loadedAt: now
  };

  return entries;
}

export function parseAgentConfig(config: unknown): AgentConfigSnapshot {
  if (!config || typeof config !== "object") {
    return {
      managedPolicies: [],
      runtimeProvider: "manifest-runtime",
      sourceAgentId: null
    };
  }

  const candidate = config as Record<string, unknown>;
  const managedPolicies = Array.isArray(candidate.managedPolicies)
    ? candidate.managedPolicies
        .filter((value): value is ManagedAgentPolicy => {
          if (!value || typeof value !== "object") {
            return false;
          }

          const policy = value as Record<string, unknown>;
          return (
            typeof policy.id === "string" &&
            typeof policy.name === "string" &&
            typeof policy.effect === "string" &&
            Array.isArray(policy.actions)
          );
        })
        .map((policy) => {
          const effect: ManagedAgentPolicy["effect"] =
            policy.effect === "deny" ? "deny" : "allow";

          return {
            actions: policy.actions.filter((value): value is string => typeof value === "string"),
            effect,
            id: policy.id,
            name: policy.name,
            ...(typeof policy.enabled === "boolean" ? { enabled: policy.enabled } : {}),
            ...(typeof policy.reason === "string" ? { reason: policy.reason } : {})
          } satisfies ManagedAgentPolicy;
        })
    : [];
  const runtime =
    candidate.runtime && typeof candidate.runtime === "object" && candidate.runtime !== null
      ? (candidate.runtime as Record<string, unknown>)
      : {};
  const runtimeProvider =
    runtime.provider === "python-orchestrator" ? "python-orchestrator" : "manifest-runtime";

  return {
    managedPolicies,
    runtimeProvider,
    sourceAgentId: typeof candidate.sourceAgentId === "string" ? candidate.sourceAgentId : null
  };
}

export function matchesPattern(candidate: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/\\\*/g, ".*")}$`).test(candidate);
}

export function readAuditMemoryPayload(diff: unknown): AuditMemoryPayload {
  if (!diff || typeof diff !== "object") {
    return {};
  }

  const candidate = diff as Record<string, unknown>;
  return {
    ...(typeof candidate.expiresAt === "number" ? { expiresAt: candidate.expiresAt } : {}),
    ...(typeof candidate.value === "string" ? { value: candidate.value } : {})
  };
}

export function readSessionId(input: Record<string, unknown>): string | null {
  if (typeof input.sessionId === "string" && input.sessionId.trim().length > 0) {
    return input.sessionId.trim();
  }

  if (
    typeof input.context === "object" &&
    input.context !== null &&
    typeof (input.context as Record<string, unknown>).sessionId === "string"
  ) {
    const candidate = (input.context as Record<string, unknown>).sessionId as string;
    return candidate.trim().length > 0 ? candidate.trim() : null;
  }

  return null;
}

export function readNumbers(value: unknown): number[] {
  if (typeof value === "number" && Number.isFinite(value)) {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => readNumbers(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap((item) => readNumbers(item));
  }

  return [];
}

export function readStrings(value: unknown): string[] {
  if (typeof value === "string" && value.trim().length > 0) {
    return [value.trim()];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => readStrings(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap((item) => readStrings(item));
  }

  return [];
}

export function toJsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function createRuntimeError(code: string, message: string): Error & { code: string } {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
}
