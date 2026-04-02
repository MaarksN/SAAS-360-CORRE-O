import {
  Prisma,
  prisma,
  WorkflowExecutionStatus,
  WorkflowTriggerType
} from "@birthub/database";
import {
  type ConnectorExecutor,
  type AgentExecutor,
  type HandoffExecutor,
  type NotificationDispatcher
} from "@birthub/workflows-core";
import { Queue } from "bullmq";

import { processWorkflowExecutionJob } from "./runner.execution.js";
import {
  WORKFLOW_EXECUTION_QUEUE,
  calculateBackoff,
  logger,
  shouldFollowTransition
} from "./runner.shared.js";

export interface WorkflowExecutionJobPayload {
  attempt: number;
  executionId: string;
  organizationId: string;
  stepKey: string;
  tenantId: string;
  triggerPayload: Record<string, unknown>;
  triggerType: WorkflowTriggerType;
  workflowId: string;
}

export interface WorkflowTriggerJobPayload {
  organizationId: string;
  tenantId: string;
  triggerPayload: Record<string, unknown>;
  triggerType: WorkflowTriggerType;
  workflowId: string;
}

export interface WorkflowRunnerDependencies {
  agentExecutor?: AgentExecutor;
  connectorExecutor?: ConnectorExecutor;
  handoffExecutor?: HandoffExecutor;
  httpRequestRateLimiter?: {
    consume: (key: string, limit: number, windowSeconds: number) => Promise<void>;
  };
  notificationDispatcher?: NotificationDispatcher;
}

export { calculateBackoff, shouldFollowTransition };

export class WorkflowRunner {
  private readonly executionQueue: Queue<WorkflowExecutionJobPayload>;
  private readonly dependencies: WorkflowRunnerDependencies;

  constructor(
    executionQueueConnection: Queue<WorkflowExecutionJobPayload>,
    dependencies: WorkflowRunnerDependencies = {}
  ) {
    this.executionQueue = executionQueueConnection;
    this.dependencies = dependencies;
  }

  async processTriggerJob(payload: WorkflowTriggerJobPayload): Promise<void> {
    const workflow = await prisma.workflow.findFirst({
      include: {
        steps: true
      },
      where: {
        id: payload.workflowId,
        status: "PUBLISHED",
        tenantId: payload.tenantId
      }
    });

    if (!workflow) {
      logger.warn({ payload }, "Workflow trigger dropped because workflow was not found/published");
      return;
    }

    const execution = await prisma.workflowExecution.create({
      data: {
        organizationId: payload.organizationId,
        status: WorkflowExecutionStatus.RUNNING,
        tenantId: payload.tenantId,
        triggerPayload: payload.triggerPayload as Prisma.InputJsonValue,
        triggerType: payload.triggerType,
        workflowId: workflow.id
      }
    });

    const triggerStep = workflow.steps.find(
      (step) =>
        step.type === "TRIGGER_CRON" ||
        step.type === "TRIGGER_EVENT" ||
        step.type === "TRIGGER_WEBHOOK"
    );

    if (!triggerStep) {
      await prisma.workflowExecution.update({
        data: {
          completedAt: new Date(),
          errorMessage: "Workflow has no trigger step configured.",
          status: WorkflowExecutionStatus.FAILED
        },
        where: {
          id: execution.id
        }
      });
      return;
    }

    await this.executionQueue.add(
      "workflow-step",
      {
        attempt: 1,
        executionId: execution.id,
        organizationId: payload.organizationId,
        stepKey: triggerStep.key,
        tenantId: payload.tenantId,
        triggerPayload: payload.triggerPayload,
        triggerType: payload.triggerType,
        workflowId: payload.workflowId
      },
      {
        jobId: `${execution.id}:${triggerStep.key}:1`
      }
    );
  }

  async processExecutionJob(payload: WorkflowExecutionJobPayload): Promise<void> {
    await processWorkflowExecutionJob({
      dependencies: this.dependencies,
      executionQueue: this.executionQueue,
      payload
    });
  }
}

export function createWorkflowExecutionQueue(
  connection: Queue<WorkflowExecutionJobPayload>
): Queue<WorkflowExecutionJobPayload> {
  return connection;
}

export const workflowQueueNames = {
  execution: WORKFLOW_EXECUTION_QUEUE,
  trigger: "workflow-trigger"
} as const;
