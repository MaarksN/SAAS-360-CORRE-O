import type { AgentManifest, ManagedAgentPolicy } from "@birthub/agents-core";
import { prisma } from "@birthub/database";

export type AgentConfigSnapshot = {
  connectors: Record<string, unknown>;
  installedAt: string | null;
  installedVersion: string;
  latestAvailableVersion: string;
  managedPolicies: ManagedAgentPolicy[];
  packId: string | null;
  runtimeProvider: "manifest-runtime" | "python-orchestrator";
  sourceAgentId: string | null;
  status: string;
};

export type InstalledAgentExecutionRow = {
  durationMs: number;
  id: string;
  mode: "DRY_RUN" | "LIVE" | "UNKNOWN";
  startedAt: string;
  status: "FAILED" | "RUNNING" | "SUCCESS";
};

export type AgentRecord = Exclude<Awaited<ReturnType<typeof prisma.agent.findFirst>>, null>;
export type AgentExecutionRecord = Awaited<ReturnType<typeof prisma.agentExecution.findMany>>[number];
export type OrganizationRecord = Exclude<Awaited<ReturnType<typeof prisma.organization.findFirst>>, null>;

export interface InstalledAgentSnapshot {
  catalogAgentId: string;
  connectors: Record<string, unknown>;
  executionCount: number;
  executions: InstalledAgentExecutionRow[];
  failRate: number;
  id: string;
  keywords: string[];
  lastRun: string | null;
  logs: string[];
  manifest: AgentManifest;
  name: string;
  runtimeProvider: "manifest-runtime" | "python-orchestrator";
  sourceStatus: string;
  status: string;
  tags: string[];
  version: string;
}

export type ResolvedInstalledAgent = {
  agent: AgentRecord;
  config: AgentConfigSnapshot;
  manifest: AgentManifest;
  organization: OrganizationRecord;
};

export type InstalledAgentRunResult = {
  catalogAgentId: string;
  executionId: string;
  mode: "LIVE";
  reused: boolean;
};
