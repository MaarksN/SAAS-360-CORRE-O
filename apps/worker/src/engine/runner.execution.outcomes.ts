import {
  Prisma,
  prisma,
  StepResultStatus,
  WorkflowExecutionStatus,
  WorkflowStepOnError
} from "@birthub/database";

import type { WorkflowExecutionJobPayload } from "./runner.js";
import type {
  ExecutionContext,
  WorkflowExecutionQueue
} from "./runner.execution.js";
import {
  MAX_ATTEMPTS,
  calculateBackoff,
  shouldFollowTransition
} from "./runner.shared.js";

async function recordSuccessfulStep(
  context: ExecutionContext,
  payload: WorkflowExecutionJobPayload,
  output: unknown
): Promise<void> {
  const normalizedOutput = context.normalizeOutput(output);
  const isDelayStep = context.step.type === "DELAY";

  await prisma.stepResult.create({
    data: {
      attempt: payload.attempt,
      executionId: payload.executionId,
      externalPayloadUrl: normalizedOutput.externalPayloadUrl,
      finishedAt: context.now,
      input: {
        _cacheHash: context.stepInputHash,
        triggerPayload: payload.triggerPayload
      } as Prisma.InputJsonValue,
      organizationId: payload.organizationId,
      output: normalizedOutput.output as Prisma.InputJsonValue,
      outputPreview: normalizedOutput.outputPreview,
      outputSize: normalizedOutput.outputSize,
      startedAt: context.now,
      status: isDelayStep ? StepResultStatus.WAITING : StepResultStatus.SUCCESS,
      stepId: context.step.id,
      tenantId: payload.tenantId,
      workflowId: payload.workflowId
    }
  });

  await prisma.workflowExecution.update({
    data: {
      depth: context.execution.depth + 1
    },
    where: {
      id: payload.executionId
    }
  });
}

async function markExecutionSuccess(context: ExecutionContext): Promise<void> {
  await prisma.workflowExecution.update({
    data: {
      completedAt: new Date(),
      durationMs: Date.now() - context.execution.startedAt.getTime(),
      status: WorkflowExecutionStatus.SUCCESS
    },
    where: {
      id: context.execution.id
    }
  });
}

function resolveDelayMs(context: ExecutionContext, output: unknown): number {
  if (context.step.type !== "DELAY") {
    return 0;
  }

  const delayMs = Number(
    (output as { delayMs?: unknown })?.delayMs ??
      (context.step.config as { duration_ms?: unknown }).duration_ms
  );

  return Number.isFinite(delayMs) ? Math.max(0, delayMs) : 0;
}

function buildQueuedPayload(
  payload: WorkflowExecutionJobPayload,
  stepKey: string,
  attempt: number
): WorkflowExecutionJobPayload {
  return {
    attempt,
    executionId: payload.executionId,
    organizationId: payload.organizationId,
    stepKey,
    tenantId: payload.tenantId,
    triggerPayload: payload.triggerPayload,
    triggerType: payload.triggerType,
    workflowId: payload.workflowId
  };
}

async function enqueueTransitions(input: {
  context: ExecutionContext;
  executionQueue: WorkflowExecutionQueue;
  output: unknown;
  payload: WorkflowExecutionJobPayload;
  transitions: ExecutionContext["workflow"]["transitions"];
}): Promise<number> {
  let enqueuedCount = 0;

  for (const transition of input.transitions) {
    const nextStep = input.context.workflow.steps.find(
      (candidate) => candidate.id === transition.targetStepId
    );

    if (!nextStep) {
      continue;
    }

    await input.executionQueue.add(
      "workflow-step",
      buildQueuedPayload(input.payload, nextStep.key, 1),
      {
        delay: resolveDelayMs(input.context, input.output),
        jobId: `${input.payload.executionId}:${nextStep.key}:${Date.now()}`
      }
    );

    enqueuedCount += 1;
  }

  return enqueuedCount;
}

function findMatchingTransitions(
  context: ExecutionContext,
  output: unknown,
  failed: boolean
): ExecutionContext["workflow"]["transitions"] {
  return context.workflow.transitions.filter((transition) => {
    if (transition.sourceStepId !== context.step.id) {
      return false;
    }

    return shouldFollowTransition(transition.route, output, failed);
  });
}

async function handleSuccessfulExecution(input: {
  context: ExecutionContext;
  executionQueue: WorkflowExecutionQueue;
  output: unknown;
  payload: WorkflowExecutionJobPayload;
}): Promise<void> {
  const nextTransitions = findMatchingTransitions(input.context, input.output, false);

  if (nextTransitions.length === 0) {
    await markExecutionSuccess(input.context);
    return;
  }

  await enqueueTransitions({
    context: input.context,
    executionQueue: input.executionQueue,
    output: input.output,
    payload: input.payload,
    transitions: nextTransitions
  });
}

async function recordFailedStep(
  context: ExecutionContext,
  payload: WorkflowExecutionJobPayload,
  error: unknown
): Promise<void> {
  await prisma.stepResult.create({
    data: {
      attempt: payload.attempt,
      errorMessage: error instanceof Error ? error.message : "Unknown step execution error",
      executionId: payload.executionId,
      finishedAt: context.now,
      input: {
        _cacheHash: context.stepInputHash,
        triggerPayload: payload.triggerPayload
      } as Prisma.InputJsonValue,
      organizationId: payload.organizationId,
      outputSize: 0,
      startedAt: context.now,
      status: StepResultStatus.FAILED,
      stepId: context.step.id,
      tenantId: payload.tenantId,
      workflowId: payload.workflowId
    }
  });
}

async function scheduleRetry(
  executionQueue: WorkflowExecutionQueue,
  payload: WorkflowExecutionJobPayload
): Promise<void> {
  await executionQueue.add(
    "workflow-step",
    {
      ...payload,
      attempt: payload.attempt + 1
    },
    {
      delay: calculateBackoff(payload.attempt),
      jobId: `${payload.executionId}:${payload.stepKey}:${payload.attempt + 1}`
    }
  );
}

async function handleFallbackTransitions(input: {
  context: ExecutionContext;
  executionQueue: WorkflowExecutionQueue;
  payload: WorkflowExecutionJobPayload;
}): Promise<boolean> {
  if (input.context.step.onError !== WorkflowStepOnError.CONTINUE) {
    return false;
  }

  const fallbackTransitions = findMatchingTransitions(input.context, null, true);

  if (fallbackTransitions.length === 0) {
    return false;
  }

  await enqueueTransitions({
    context: input.context,
    executionQueue: input.executionQueue,
    output: null,
    payload: input.payload,
    transitions: fallbackTransitions
  });

  return true;
}

async function failExecution(input: {
  context: ExecutionContext;
  error: unknown;
}): Promise<void> {
  await prisma.workflowExecution.update({
    data: {
      completedAt: new Date(),
      durationMs: Date.now() - input.context.execution.startedAt.getTime(),
      errorMessage: input.error instanceof Error ? input.error.message : "Workflow execution failed",
      status: WorkflowExecutionStatus.FAILED
    },
    where: {
      id: input.context.execution.id
    }
  });
}

export async function handleExecutionOutcome(input: {
  context: ExecutionContext;
  error?: unknown;
  executionQueue: WorkflowExecutionQueue;
  output?: unknown;
  payload: WorkflowExecutionJobPayload;
}): Promise<void> {
  if (input.error === undefined) {
    await recordSuccessfulStep(input.context, input.payload, input.output);
    await handleSuccessfulExecution({
      context: input.context,
      executionQueue: input.executionQueue,
      output: input.output,
      payload: input.payload
    });
    return;
  }

  await recordFailedStep(input.context, input.payload, input.error);

  if (input.payload.attempt < MAX_ATTEMPTS) {
    await scheduleRetry(input.executionQueue, input.payload);
    return;
  }

  if (
    await handleFallbackTransitions({
      context: input.context,
      executionQueue: input.executionQueue,
      payload: input.payload
    })
  ) {
    return;
  }

  await failExecution({
    context: input.context,
    error: input.error
  });
}
