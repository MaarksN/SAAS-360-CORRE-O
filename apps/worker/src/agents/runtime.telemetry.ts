import { prisma, Prisma } from "@birthub/database";
import { computeOutputHash, type AgentLearningRecord, type AgentManifest } from "@birthub/agents-core";
import { randomUUID } from "node:crypto";
import { runtimeMemory } from "./runtime.memory.js";
import { ensureConversationThread, createConversationMessage } from "./conversations.js";

const MINIMUM_APPROVED_LEARNING_CONFIDENCE = 0.7;
const SHARED_LEARNING_LIMIT = 8;

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

export async function querySharedLearning(input: {
  keywords: string[];
  tenantId: string;
}): Promise<AgentLearningRecord[]> {
  const fromMemory = await runtimeMemory.querySharedLearning(input.tenantId, {
    approvedOnly: true,
    keywords: input.keywords,
    minimumConfidence: MINIMUM_APPROVED_LEARNING_CONFIDENCE
  });
  const fromAuditLogs = await prisma.auditLog.findMany({
    orderBy: {
      createdAt: "desc"
    },
    take: 50,
    where: {
      action: "AGENT_LEARNING_PUBLISHED",
      entityType: "agent_learning",
      tenantId: input.tenantId
    }
  });

  const merged = new Map<string, AgentLearningRecord>();
  for (const record of fromMemory) {
    merged.set(record.id, record);
  }

  for (const log of fromAuditLogs) {
    const diff = log.diff as Record<string, unknown>;
    if (
      typeof diff.id === "string" &&
      typeof diff.summary === "string" &&
      typeof diff.confidence === "number" &&
      Array.isArray(diff.keywords) &&
      diff.keywords.some(
        (keyword) =>
          typeof keyword === "string" &&
          input.keywords.some((candidate) => candidate.toLowerCase() === keyword.toLowerCase())
      )
    ) {
      merged.set(diff.id, diff as unknown as AgentLearningRecord);
    }
  }

  return Array.from(merged.values())
    .filter((record) => record.confidence >= MINIMUM_APPROVED_LEARNING_CONFIDENCE)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, SHARED_LEARNING_LIMIT);
}

export async function appendConversationMessage(input: {
  agentId: string;
  content: string;
  correlationId?: string | null;
  organizationId?: string | null;
  role: "assistant" | "user";
  sessionId?: string | null;
  tenantId: string;
}): Promise<void> {
  const sessionId = input.sessionId?.trim();
  if (!sessionId) {
    return;
  }

  await runtimeMemory.appendConversationMessage(
    input.tenantId,
    input.agentId,
    sessionId,
    {
      content: input.content,
      role: input.role
    },
    {
      ttlSeconds: 7 * 24 * 60 * 60
    }
  );

  if (!input.organizationId) {
    return;
  }

  const thread = await ensureConversationThread({
    channel: "agent-runtime",
    correlationId: input.correlationId ?? sessionId,
    externalThreadId: sessionId,
    metadata: {
      agentId: input.agentId,
      sessionId
    },
    organizationId: input.organizationId,
    tenantId: input.tenantId
  });

  await createConversationMessage({
    agentId: input.agentId,
    content: input.content,
    direction: input.role === "user" ? "inbound" : "outbound",
    metadata: {
      sessionId
    },
    organizationId: input.organizationId,
    role: input.role,
    tenantId: input.tenantId,
    threadId: thread.id
  });
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
