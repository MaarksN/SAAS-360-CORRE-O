import { createHash } from "node:crypto";

import { PolicyEngine } from "@birthub/agents-core/policy/engine";
import {
  DbReadTool,
  DbWriteTool,
  HttpTool,
  SendEmailTool,
  type BaseTool
} from "@birthub/agents-core/tools";
import { createLogger } from "@birthub/logger";

import type {
  AgentExecutionRequest,
  PlanBuilder,
  PlannedToolCall
} from "./planExecutor.js";

const logger = createLogger("plan-executor");

export class MockPlanBuilder implements PlanBuilder {
  build(input: AgentExecutionRequest): Promise<PlannedToolCall[]> {
    const providedCalls = input.input.toolCalls;
    if (Array.isArray(providedCalls)) {
      return Promise.resolve(
        providedCalls.filter((value): value is PlannedToolCall => {
          return (
            typeof value === "object" &&
            value !== null &&
            "tool" in value &&
            "input" in value &&
            typeof (value as { tool?: unknown }).tool === "string"
          );
        })
      );
    }

    return Promise.resolve([]);
  }
}

export function createExecutorError(code: string, message: string): Error & { code: string } {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
}

export function buildExecutionDigest(input: AgentExecutionRequest): string {
  return createHash("sha256")
    .update(JSON.stringify({ input: input.input, toolCalls: input.toolCalls }))
    .digest("hex");
}

export function jitter(delayMs: number): number {
  const spread = Math.floor(delayMs * 0.15);
  const randomDelta = Math.floor(Math.random() * (spread + 1));
  return delayMs + randomDelta;
}

export async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function createDefaultTools(): Record<string, BaseTool<unknown, unknown>> {
  const policyEngine = new PolicyEngine([
    {
      action: "tool.*",
      effect: "allow",
      id: "default-allow-tools"
    }
  ]);

  const memoryRows: Record<string, unknown>[] = [];

  return {
    "db-read": new DbReadTool({
      executor: ({ tenantId }) => Promise.resolve(memoryRows.filter((row) => row.tenantId === tenantId)),
      policyEngine
    }) as BaseTool<unknown, unknown>,
    "db-write": new DbWriteTool({
      auditPublisher: (event) => {
        logger.info({ event }, "db-write audit event emitted");
        return Promise.resolve();
      },
      executor: ({ data, tenantId }) => {
        memoryRows.push({ ...data, tenantId });
        return Promise.resolve(1);
      },
      policyEngine
    }) as BaseTool<unknown, unknown>,
    http: new HttpTool({ policyEngine }) as BaseTool<unknown, unknown>,
    "send-email": new SendEmailTool({ policyEngine }) as BaseTool<unknown, unknown>
  };
}
