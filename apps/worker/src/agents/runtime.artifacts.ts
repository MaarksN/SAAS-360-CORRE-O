import { randomUUID } from "node:crypto";

import {
  computeOutputHash,
  type AgentLearningRecord,
  type AgentManifest
} from "@birthub/agents-core";
import { Prisma, prisma } from "@birthub/database";

import { SHARED_LEARNING_LIMIT } from "./runtime.shared.js";

export function buildLearningRecord(input: {
  agentId: string;
  manifest: AgentManifest;
  outputPreview: string;
  tenantId: string;
}): AgentLearningRecord {
  return {
    approved: true,
    appliesTo: [input.manifest.agent.id],
    confidence: 0.82,
    createdAt: new Date().toISOString(),
    evidence: [input.outputPreview],
    id: randomUUID(),
    keywords: input.manifest.keywords.slice(0, SHARED_LEARNING_LIMIT),
    lessonType: "execution-pattern",
    sourceAgentId: input.agentId,
    summary: `${input.manifest.agent.name} executou um fluxo live governado e publicou aprendizado reutilizavel.`,
    tenantId: input.tenantId
  };
}

export async function createOutputArtifact(input: {
  content: string;
  executionId: string;
  manifest: AgentManifest;
  organizationId: string;
  requireApproval: boolean;
  tenantId: string;
  type: "executive-report" | "technical-log";
  userId?: string | null;
}): Promise<string> {
  const output = await prisma.outputArtifact.create({
    data: {
      agentId: input.manifest.agent.id,
      content: input.content,
      contentHash: computeOutputHash(input.content),
      createdByUserId: input.userId ?? "system",
      organizationId: input.organizationId,
      status: input.requireApproval ? "WAITING_APPROVAL" : "COMPLETED",
      tenantId: input.tenantId,
      type: input.type
    }
  });

  await prisma.auditLog.create({
    data: {
      action: "AGENT_OUTPUT_CREATED",
      actorId: input.userId ?? null,
      diff: {
        outputId: output.id,
        status: output.status,
        type: output.type
      } as Prisma.InputJsonValue,
      entityId: input.executionId,
      entityType: "agent_execution",
      tenantId: input.tenantId
    }
  });

  return output.id;
}
