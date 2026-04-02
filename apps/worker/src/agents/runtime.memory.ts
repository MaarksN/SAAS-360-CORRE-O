import {
  AgentMemoryService,
  type AgentLearningRecord
} from "@birthub/agents-core";
import { Prisma, prisma } from "@birthub/database";

import {
  createConversationMessage,
  ensureConversationThread
} from "./conversations.js";
import {
  matchesPattern,
  MINIMUM_APPROVED_LEARNING_CONFIDENCE,
  readAuditMemoryPayload,
  SHARED_LEARNING_LIMIT
} from "./runtime.shared.js";

class PrismaAuditMemoryBackend {
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const tenantId = key.split(":")[0] ?? "unknown";
    const expiresAt = ttlSeconds !== undefined ? Date.now() + ttlSeconds * 1000 : undefined;

    await prisma.auditLog.create({
      data: {
        action: "AGENT_MEMORY_SET",
        diff: {
          ...(expiresAt !== undefined ? { expiresAt } : {}),
          value
        } as Prisma.InputJsonValue,
        entityId: key,
        entityType: "agent_memory",
        tenantId
      }
    });
  }

  async get(key: string): Promise<string | null> {
    const tenantId = key.split(":")[0] ?? "unknown";
    const latest = await prisma.auditLog.findFirst({
      orderBy: {
        createdAt: "desc"
      },
      where: {
        action: {
          in: ["AGENT_MEMORY_DELETE", "AGENT_MEMORY_SET"]
        },
        entityId: key,
        entityType: "agent_memory",
        tenantId
      }
    });

    if (!latest || latest.action === "AGENT_MEMORY_DELETE") {
      return null;
    }

    const payload = readAuditMemoryPayload(latest.diff);
    if (payload.expiresAt !== undefined && payload.expiresAt <= Date.now()) {
      return null;
    }

    return payload.value ?? null;
  }

  async del(key: string): Promise<number> {
    const tenantId = key.split(":")[0] ?? "unknown";
    const before = await this.get(key);

    await prisma.auditLog.create({
      data: {
        action: "AGENT_MEMORY_DELETE",
        diff: {} as Prisma.InputJsonValue,
        entityId: key,
        entityType: "agent_memory",
        tenantId
      }
    });

    return before ? 1 : 0;
  }

  async keys(pattern: string): Promise<string[]> {
    const tenantId = pattern.split(":")[0] ?? "unknown";
    const records = await prisma.auditLog.findMany({
      orderBy: {
        createdAt: "desc"
      },
      where: {
        action: {
          in: ["AGENT_MEMORY_DELETE", "AGENT_MEMORY_SET"]
        },
        entityType: "agent_memory",
        tenantId
      }
    });

    const latestByKey = new Map<
      string,
      {
        action: string;
        diff: unknown;
      }
    >();

    for (const record of records) {
      if (!latestByKey.has(record.entityId)) {
        latestByKey.set(record.entityId, {
          action: record.action,
          diff: record.diff
        });
      }
    }

    return Array.from(latestByKey.entries())
      .filter(([key, value]) => {
        if (value.action === "AGENT_MEMORY_DELETE") {
          return false;
        }

        const payload = readAuditMemoryPayload(value.diff);
        if (payload.expiresAt !== undefined && payload.expiresAt <= Date.now()) {
          return false;
        }

        return matchesPattern(key, pattern);
      })
      .map(([key]) => key);
  }
}

export const runtimeMemory = new AgentMemoryService(new PrismaAuditMemoryBackend());

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
