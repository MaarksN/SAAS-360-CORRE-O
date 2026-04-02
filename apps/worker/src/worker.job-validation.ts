import { taskJobSchema } from "@birthub/config";
import { createHash, createHmac } from "node:crypto";
import { z } from "zod";

export { taskJobSchema as legacyTaskJobSchema };

export const agentExecutionJobSchema = z
  .object({
    agentId: z.string().min(1),
    catalogAgentId: z.string().min(1).optional(),
    executionId: z.string().min(1),
    input: z.record(z.string(), z.unknown()),
    organizationId: z.string().min(1).optional(),
    tenantId: z.string().min(1),
    userId: z.string().min(1).optional(),
    toolCalls: z
      .array(
        z.object({
          input: z.unknown(),
          tool: z.string().min(1)
        })
      )
      .optional()
  })
  .strict();

export type CrmSyncJobPayload = {
  kind: "company-upsert" | "health-score-sync";
  organizationId: string;
  tenantId: string;
};

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function hashPayload(payload: string): string {
  return createHash("sha256").update(payload, "utf8").digest("hex");
}

function serializeLegacyTaskSignaturePayload(input: {
  context: NonNullable<z.infer<typeof taskJobSchema>["context"]>;
  payload: z.infer<typeof taskJobSchema>;
}): string {
  return JSON.stringify({
    agentId: input.payload.agentId,
    approvalRequired: input.payload.approvalRequired,
    context: input.context,
    estimatedCostBRL: input.payload.estimatedCostBRL,
    executionMode: input.payload.executionMode,
    payload: input.payload.payload,
    requestId: input.payload.requestId,
    tenantId: input.payload.tenantId,
    type: input.payload.type,
    userId: input.payload.userId,
    version: input.payload.version
  });
}

export function validateLegacyTaskJob(input: {
  fallbackSecret: string;
  jobId: string;
  payload: z.infer<typeof taskJobSchema>;
  tenantSecret?: string;
}): string {
  const context = input.payload.context ?? {
    actorId: input.payload.userId ?? "system",
    jobId: input.jobId,
    organizationId: input.payload.tenantId ?? "default-tenant",
    scopedAt: new Date().toISOString(),
    tenantId: input.payload.tenantId ?? "default-tenant"
  };

  if (!input.payload.tenantId || input.payload.tenantId !== context.tenantId) {
    throw new Error("JOB_CONTEXT_TENANT_MISMATCH");
  }

  if (!input.payload.userId || input.payload.userId !== context.actorId) {
    throw new Error("JOB_CONTEXT_ACTOR_MISMATCH");
  }

  if (context.jobId !== input.jobId) {
    throw new Error("JOB_CONTEXT_ID_MISMATCH");
  }

  const signedPayload = serializeLegacyTaskSignaturePayload({
    context,
    payload: input.payload
  });
  const expectedSignature = signPayload(
    signedPayload,
    input.tenantSecret ?? input.fallbackSecret
  );

  if (input.payload.signature !== "unsigned" && expectedSignature !== input.payload.signature) {
    throw new Error("JOB_SIGNATURE_INVALID");
  }

  return input.payload.tenantId;
}
