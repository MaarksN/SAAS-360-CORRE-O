import { createHash } from "node:crypto";

import { prisma, QuotaResourceType, WorkflowTransitionRoute } from "@birthub/database";
import { createLogger } from "@birthub/logger";

export const logger: ReturnType<typeof createLogger> = createLogger("workflow-runner");
export const MAX_ATTEMPTS = 5;
export const WORKFLOW_EXECUTION_QUEUE = "workflow-execution";

const OUTPUT_MAX_BYTES = 200 * 1024;

export type StepOutputEnvelope = {
  externalPayloadUrl: string | null;
  output: unknown;
  outputPreview: string | null;
  outputSize: number;
};

export function normalizeOutput(
  output: unknown,
  executionId: string,
  stepKey: string
): StepOutputEnvelope {
  const serialized = JSON.stringify(output ?? null);
  const outputSize = Buffer.byteLength(serialized, "utf8");

  if (outputSize <= OUTPUT_MAX_BYTES) {
    return {
      externalPayloadUrl: null,
      output,
      outputPreview: null,
      outputSize
    };
  }

  const externalPayloadUrl = `s3://workflow-step-results/${executionId}/${stepKey}/${createHash("sha256")
    .update(serialized)
    .digest("hex")}.json`;

  return {
    externalPayloadUrl,
    output: null,
    outputPreview: `${serialized.slice(0, 1_500)}...`,
    outputSize
  };
}

function isConditionTrue(output: unknown): boolean {
  if (typeof output !== "object" || output === null) {
    return false;
  }

  return Boolean((output as { result?: unknown }).result);
}

export function shouldFollowTransition(
  route: WorkflowTransitionRoute,
  output: unknown,
  failed: boolean
): boolean {
  if (failed) {
    return route === WorkflowTransitionRoute.ON_FAILURE || route === WorkflowTransitionRoute.FALLBACK;
  }

  if (route === WorkflowTransitionRoute.ALWAYS || route === WorkflowTransitionRoute.ON_SUCCESS) {
    return true;
  }

  if (route === WorkflowTransitionRoute.IF_TRUE) {
    return isConditionTrue(output);
  }

  if (route === WorkflowTransitionRoute.IF_FALSE) {
    return !isConditionTrue(output);
  }

  return false;
}

export function calculateBackoff(attempt: number): number {
  return Math.min(60_000, Math.pow(2, attempt) * 1000);
}

export async function consumeSharedAgentBudget(tenantId: string): Promise<void> {
  const record = await prisma.quotaUsage.findFirst({
    orderBy: {
      resetAt: "desc"
    },
    where: {
      resourceType: QuotaResourceType.AI_PROMPTS,
      tenantId
    }
  });

  if (!record) {
    return;
  }

  if (record.count >= record.limit) {
    throw new Error("SHARED_RATE_LIMIT_EXCEEDED");
  }

  await prisma.quotaUsage.update({
    data: {
      count: {
        increment: 1
      }
    },
    where: {
      id: record.id
    }
  });
}
