import {
  ExecutionSource,
  Prisma,
  prisma
} from "@birthub/database";

function toJsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function persistExecutionStarted(input: {
  agentId: string;
  executionId: string;
  inputPayload: Record<string, unknown>;
  organizationId?: string | null;
  source: ExecutionSource;
  tenantId: string;
  userId?: string | null;
}) {
  await prisma.agentExecution.upsert({
    create: {
      agentId: input.agentId,
      id: input.executionId,
      input: toJsonValue(input.inputPayload),
      organizationId: input.organizationId ?? null,
      source: input.source,
      tenantId: input.tenantId,
      userId: input.userId ?? null
    },
    update: {
      agentId: input.agentId,
      input: toJsonValue(input.inputPayload),
      organizationId: input.organizationId ?? null,
      source: input.source,
      status: "RUNNING",
      tenantId: input.tenantId,
      userId: input.userId ?? null
    },
    where: {
      id: input.executionId
    }
  });
}

export async function persistExecutionFinished(input: {
  errorMessage?: string;
  executionId: string;
  metadata?: Record<string, unknown>;
  output?: Record<string, unknown>;
  outputHash?: string;
  status: "FAILED" | "SUCCESS" | "WAITING_APPROVAL";
}) {
  await prisma.agentExecution.update({
    data: {
      completedAt: input.status === "WAITING_APPROVAL" ? null : new Date(),
      errorMessage: input.errorMessage ?? null,
      outputHash: input.outputHash ?? null,
      ...(input.metadata !== undefined ? { metadata: toJsonValue(input.metadata) } : {}),
      ...(input.output !== undefined ? { output: toJsonValue(input.output) } : {}),
      status: input.status
    },
    where: {
      id: input.executionId
    }
  });
}
