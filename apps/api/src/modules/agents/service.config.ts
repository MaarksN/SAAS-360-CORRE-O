import type { ManagedAgentPolicy } from "@birthub/agents-core";

import { decryptConnectorsMap } from "../../lib/encryption.js";
import type { AgentConfigSnapshot } from "./service.types.js";

export function parseAgentConfig(config: unknown): AgentConfigSnapshot {
  if (!config || typeof config !== "object") {
    return {
      connectors: {},
      installedAt: null,
      installedVersion: "1.0.0",
      latestAvailableVersion: "1.0.0",
      managedPolicies: [],
      packId: null,
      runtimeProvider: "manifest-runtime",
      sourceAgentId: null,
      status: "installed"
    };
  }

  const candidate = config as Record<string, unknown>;
  const rawConnectors =
    candidate.connectors && typeof candidate.connectors === "object" && !Array.isArray(candidate.connectors)
      ? (candidate.connectors as Record<string, unknown>)
      : {};
  const connectors = decryptConnectorsMap(rawConnectors);
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

  return {
    connectors,
    installedAt: typeof candidate.installedAt === "string" ? candidate.installedAt : null,
    installedVersion:
      typeof candidate.installedVersion === "string" ? candidate.installedVersion : "1.0.0",
    latestAvailableVersion:
      typeof candidate.latestAvailableVersion === "string"
        ? candidate.latestAvailableVersion
        : typeof candidate.installedVersion === "string"
          ? candidate.installedVersion
          : "1.0.0",
    managedPolicies,
    packId: typeof candidate.packId === "string" ? candidate.packId : null,
    runtimeProvider:
      runtime.provider === "python-orchestrator" ? "python-orchestrator" : "manifest-runtime",
    sourceAgentId: typeof candidate.sourceAgentId === "string" ? candidate.sourceAgentId : null,
    status: typeof candidate.status === "string" ? candidate.status : "installed"
  };
}

export function normalizeConfigObject(config: unknown): Record<string, unknown> {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {};
  }

  return { ...(config as Record<string, unknown>) };
}

export function mergeManagedPolicies(
  currentPolicies: ManagedAgentPolicy[],
  nextPolicy: ManagedAgentPolicy
): ManagedAgentPolicy[] {
  const merged = new Map<string, ManagedAgentPolicy>();

  for (const policy of [...currentPolicies, nextPolicy]) {
    merged.set(policy.id, policy);
  }

  return Array.from(merged.values()).sort((left, right) => left.name.localeCompare(right.name));
}
