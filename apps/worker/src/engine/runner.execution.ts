import { createHash } from "node:crypto";

import {
  prisma,
  StepResultStatus,
  WorkflowExecutionStatus
} from "@birthub/database";
import {
  executeStep,
  stepSchema
} from "@birthub/workflows-core";
import { Queue } from "bullmq";

import type {
  WorkflowExecutionJobPayload,
  WorkflowRunnerDependencies
} from "./runner.js";
import { handleExecutionOutcome } from "./runner.execution.outcomes.js";
import {
  consumeSharedAgentBudget,
  logger,
  normalizeOutput
} from "./runner.shared.js";

type StepExecutionStatus = "FAILED" | "SKIPPED" | "SUCCESS" | "WAITING";
export type WorkflowExecutionQueue = Queue<WorkflowExecutionJobPayload>;

type WorkflowExecutionRecord = NonNullable<
  Awaited<ReturnType<typeof prisma.workflowExecution.findUnique>>
>;
type WorkflowDefinition = NonNullable<Awaited<ReturnType<typeof findWorkflowDefinition>>>;
type WorkflowStep = WorkflowDefinition["steps"][number];
type StepsContext = Record<
  string,
  {
    input: unknown;
    output: unknown;
    status: StepExecutionStatus;
  }
>;
type ParsedWorkflowStep = ReturnType<typeof stepSchema.parse>;

export type ExecutionContext = {
  execution: WorkflowExecutionRecord;
  normalizeOutput: (output: unknown) => ReturnType<typeof normalizeOutput>;
  now: Date;
  parsedStep: ParsedWorkflowStep;
  step: WorkflowStep;
  stepInputHash: string;
  stepsContext: StepsContext;
  workflow: WorkflowDefinition;
};

function buildStepInputHash(
  payload: WorkflowExecutionJobPayload,
  stepKey: string,
  stepsContext: StepsContext
): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        stepKey,
        stepsContext,
        triggerPayload: payload.triggerPayload
      })
    )
    .digest("hex");
}

async function findWorkflowDefinition(payload: WorkflowExecutionJobPayload) {
  return prisma.workflow.findFirst({
    include: {
      steps: true,
      transitions: true
    },
    where: {
      id: payload.workflowId,
      tenantId: payload.tenantId
    }
  });
}

async function failExecution(input: {
  execution: WorkflowExecutionRecord;
  message: string;
}): Promise<void> {
  await prisma.workflowExecution.update({
    data: {
      completedAt: new Date(),
      durationMs: Date.now() - input.execution.startedAt.getTime(),
      errorMessage: input.message,
      status: WorkflowExecutionStatus.FAILED
    },
    where: {
      id: input.execution.id
    }
  });
}

function buildStepsContext(
  previousResults: Array<{
    input: unknown;
    output: unknown;
    status: StepResultStatus;
    step: {
      key: string;
    };
  }>
): StepsContext {
  return Object.fromEntries(
    previousResults.map((result) => [
      result.step.key,
      {
        input: result.input,
        output: result.output,
        status: result.status as StepExecutionStatus
      }
    ])
  );
}

async function resolveExecutionContext(
  payload: WorkflowExecutionJobPayload
): Promise<ExecutionContext | null> {
  const execution = await prisma.workflowExecution.findUnique({
    where: {
      id: payload.executionId
    }
  });

  if (!execution || execution.status === WorkflowExecutionStatus.CANCELLED) {
    return null;
  }

  const workflow = await findWorkflowDefinition(payload);

  if (!workflow) {
    await failExecution({
      execution,
      message: "Workflow definition not found during execution."
    });
    return null;
  }

  const maxDepth = Math.max(1, workflow.maxDepth);
  if (execution.depth >= maxDepth) {
    await failExecution({
      execution,
      message: `Execution reached max_depth=${maxDepth}.`
    });
    return null;
  }

  const step = workflow.steps.find((candidate) => candidate.key === payload.stepKey);
  if (!step) {
    await failExecution({
      execution,
      message: `Step '${payload.stepKey}' not found in workflow.`
    });
    return null;
  }

  const previousResults = await prisma.stepResult.findMany({
    include: {
      step: true
    },
    orderBy: {
      createdAt: "asc"
    },
    where: {
      executionId: payload.executionId
    }
  });
  const stepsContext = buildStepsContext(previousResults);
  const parsedStep = stepSchema.parse({
    config: step.config,
    ...(step.isTrigger ? { isTrigger: step.isTrigger } : {}),
    key: step.key,
    name: step.name,
    type: step.type
  });

  return {
    execution,
    normalizeOutput: (output) => normalizeOutput(output, payload.executionId, step.key),
    now: new Date(),
    parsedStep,
    step,
    stepInputHash: buildStepInputHash(payload, step.key, stepsContext),
    stepsContext,
    workflow
  };
}

async function findCachedOutput(
  context: ExecutionContext,
  payload: WorkflowExecutionJobPayload
): Promise<unknown> {
  const cacheTTLSeconds = context.step.cacheTTLSeconds ?? 0;

  if (
    cacheTTLSeconds <= 0 ||
    (context.step.type !== "AGENT_EXECUTE" && context.step.type !== "HTTP_REQUEST")
  ) {
    return undefined;
  }

  const cacheCandidates = await prisma.stepResult.findMany({
    orderBy: {
      finishedAt: "desc"
    },
    take: 10,
    where: {
      finishedAt: {
        gte: new Date(Date.now() - cacheTTLSeconds * 1000)
      },
      status: StepResultStatus.SUCCESS,
      stepId: context.step.id,
      workflowId: payload.workflowId
    }
  });

  const cacheHit = cacheCandidates.find((candidate) => {
    if (typeof candidate.input !== "object" || candidate.input === null) {
      return false;
    }

    return (
      (candidate.input as { _cacheHash?: unknown })._cacheHash === context.stepInputHash &&
      candidate.output !== null
    );
  });

  return cacheHit?.output;
}

async function executeWorkflowStep(
  context: ExecutionContext,
  payload: WorkflowExecutionJobPayload,
  dependencies: WorkflowRunnerDependencies
): Promise<unknown> {
  if (context.step.type === "AGENT_EXECUTE") {
    await consumeSharedAgentBudget(payload.tenantId);
  }

  return executeStep(
    context.parsedStep,
    {
      executionId: payload.executionId,
      steps: context.stepsContext,
      tenantId: payload.tenantId,
      trigger: {
        output: payload.triggerPayload,
        type: payload.triggerType
      },
      workflowId: payload.workflowId
    },
    dependencies
  );
}

async function resolveStepOutput(
  context: ExecutionContext,
  payload: WorkflowExecutionJobPayload,
  dependencies: WorkflowRunnerDependencies
): Promise<unknown> {
  const cachedOutput = await findCachedOutput(context, payload);

  if (cachedOutput !== undefined) {
    return cachedOutput;
  }

  return executeWorkflowStep(context, payload, dependencies);
}

export async function processWorkflowExecutionJob(input: {
  dependencies: WorkflowRunnerDependencies;
  executionQueue: WorkflowExecutionQueue;
  payload: WorkflowExecutionJobPayload;
}): Promise<void> {
  const context = await resolveExecutionContext(input.payload);

  if (!context) {
    return;
  }

  try {
    const output = await resolveStepOutput(context, input.payload, input.dependencies);
    await handleExecutionOutcome({
      context,
      executionQueue: input.executionQueue,
      output,
      payload: input.payload
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        executionId: input.payload.executionId,
        stepKey: input.payload.stepKey,
        workflowId: input.payload.workflowId
      },
      "Workflow step execution failed"
    );

    await handleExecutionOutcome({
      context,
      error,
      executionQueue: input.executionQueue,
      payload: input.payload
    });
  }
}
