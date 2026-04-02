import type { AgentManifest } from "@birthub/agents-core";
import { PolicyEngine } from "@birthub/agents-core/policy/engine";
import { BaseTool, DbReadTool, DbWriteTool, HttpTool, SendEmailTool } from "@birthub/agents-core/tools";
import { createLogger } from "@birthub/logger";
import { z } from "zod";

import { buildToolCostTable } from "./runtime.budget.js";
import {
  readNumbers,
  readStrings
} from "./runtime.shared.js";

const logger = createLogger("agent-runtime");

class ManifestCapabilityTool extends BaseTool<Record<string, unknown>, Record<string, unknown>> {
  constructor(
    private readonly capability: {
      description: string;
      id: string;
      name: string;
    },
    options?: {
      policyEngine?: PolicyEngine;
      timeoutMs?: number;
    }
  ) {
    super({
      description: capability.description,
      inputSchema: z.object({}).catchall(z.unknown()),
      name: capability.id,
      outputSchema: z.object({}).catchall(z.unknown()),
      ...(options?.timeoutMs ? { timeoutMs: options.timeoutMs } : {})
    }, options?.policyEngine ? { policyEngine: options.policyEngine } : {});
  }

  protected execute(
    input: Record<string, unknown>,
    context: {
      agentId: string;
      policyContext?: Record<string, unknown>;
      tenantId: string;
      traceId: string;
    }
  ): Promise<Record<string, unknown>> {
    const flattenedNumbers = readNumbers(input.sourcePayload ?? input);
    const flattenedStrings = readStrings(input.sourcePayload ?? input).slice(0, 6);
    const average =
      flattenedNumbers.length > 0
        ? Math.round(
            (flattenedNumbers.reduce((total, value) => total + value, 0) /
              flattenedNumbers.length) *
              100
          ) / 100
        : 0;

    return Promise.resolve({
      agentId: context.agentId,
      capability: this.capability.name,
      capabilityId: this.capability.id,
      confidence: flattenedNumbers.length > 0 ? "medium" : "high",
      evidence: flattenedStrings,
      observedAverage: average,
      summary: `${this.capability.name} executada com ${flattenedNumbers.length} sinal(is) numerico(s) e ${flattenedStrings.length} evidencia(s) textual(is).`,
      tenantId: context.tenantId,
      traceId: context.traceId
    });
  }
}

export function createRuntimeTools(
  manifest: AgentManifest,
  policyEngine: PolicyEngine,
  defaultToolCostBrl: number
): {
  costs: Record<string, number>;
  tools: Record<string, BaseTool<unknown, unknown>>;
} {
  const costs = buildToolCostTable({
    defaultToolCostBrl,
    manifest
  });
  const tools: Record<string, BaseTool<unknown, unknown>> = {
    "db-read": new DbReadTool({
      executor: ({ query, tenantId }) =>
        Promise.resolve([
          {
            query,
            source: "agent-runtime",
            tenantId
          }
        ]),
      policyEngine
    }) as BaseTool<unknown, unknown>,
    "db-write": new DbWriteTool({
      auditPublisher: (event) => {
        logger.info({ event }, "agent-runtime db-write audit");
        return Promise.resolve();
      },
      executor: () => Promise.resolve(1),
      policyEngine
    }) as BaseTool<unknown, unknown>,
    http: new HttpTool({ policyEngine }) as BaseTool<unknown, unknown>,
    "send-email": new SendEmailTool({ policyEngine }) as BaseTool<unknown, unknown>
  };

  for (const tool of manifest.tools) {
    tools[tool.id] = new ManifestCapabilityTool(
      {
        description: tool.description,
        id: tool.id,
        name: tool.name
      },
      {
        policyEngine,
        timeoutMs: tool.timeoutMs
      }
    ) as BaseTool<unknown, unknown>;
  }

  return {
    costs,
    tools
  };
}
