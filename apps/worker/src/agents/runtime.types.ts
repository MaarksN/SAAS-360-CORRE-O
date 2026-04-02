import type {
  AgentLearningRecord,
  AgentManifest,
  AgentMemoryBackend,
  ManifestCatalogEntry,
  ManagedAgentPolicy
} from "@birthub/agents-core";
import type { Redis } from "ioredis";

export interface AgentConfigSnapshot {
  managedPolicies: ManagedAgentPolicy[];
  runtimeProvider: "manifest-runtime" | "python-orchestrator";
  sourceAgentId: string | null;
}

export interface RuntimeAgentResolution {
  installedAgentId: string | null;
  manifest: AgentManifest;
  organizationId: string | null;
  runtimeAgentId: string;
}

export interface RuntimeExecutionInput {
  agentId: string;
  catalogAgentId?: string | null;
  contextSummary?: string;
  executionId: string;
  input: Record<string, unknown>;
  organizationId?: string | null;
  redis: Redis;
  source: "MANUAL" | "WORKFLOW";
  tenantId: string;
  userId?: string | null;
}

export interface RuntimeExecutionResult {
  learningRecord: AgentLearningRecord;
  logs: string[];
  metadata: Record<string, unknown>;
  output: Record<string, unknown>;
  outputArtifactId: string;
  outputHash: string;
  status: "SUCCESS" | "WAITING_APPROVAL";
  toolCost: number;
}

export interface AuditMemoryPayload {
  expiresAt?: number;
  value?: string;
}

export type RuntimeMemoryBackend = AgentMemoryBackend;
export type RuntimeManifestCatalogEntry = ManifestCatalogEntry;
