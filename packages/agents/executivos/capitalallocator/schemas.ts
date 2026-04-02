// [SOURCE] BirthHub360_Agentes_Parallel_Plan - CapitalAllocator
import { z } from "zod";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format.");

export const BudgetSegmentSchema = z.enum([
  "brand",
  "demand_gen",
  "enterprise",
  "mid_market",
  "product_marketing"
]);
export type BudgetSegment = z.infer<typeof BudgetSegmentSchema>;

export const BudgetSectionSchema = z.enum([
  "allocation_rebalance",
  "forecast_drift",
  "scenario_buffers",
  "spend_velocity",
  "variance_hotspots"
]);
export type BudgetSection = z.infer<typeof BudgetSectionSchema>;

export const CapitalAllocatorInputSchema = z
  .object({
    constraints: z
      .object({
        currency: z.string().trim().length(3),
        language: z.enum(["pt-BR", "en-US"]),
        maxActions: z.number().int().min(1).max(12)
      })
      .strict(),
    requestId: z.string().trim().min(1),
    sections: z.array(BudgetSectionSchema).min(1),
    segments: z.array(BudgetSegmentSchema).min(1),
    targetBudgetEfficiencyPct: z.number().min(1).max(100),
    tenantId: z.string().trim().min(1),
    window: z
      .object({
        endDate: isoDateSchema,
        startDate: isoDateSchema
      })
      .strict()
  })
  .strict();
export type CapitalAllocatorInput = z.infer<typeof CapitalAllocatorInputSchema>;

export const BudgetFailureModeSchema = z.enum([
  "degraded_report",
  "human_handoff",
  "hard_fail"
]);
export type BudgetFailureMode = z.infer<typeof BudgetFailureModeSchema>;

export const BudgetEventNameSchema = z.enum([
  "capitalallocator.request.received",
  "capitalallocator.contract.loaded",
  "capitalallocator.tool.call.started",
  "capitalallocator.tool.call.succeeded",
  "capitalallocator.tool.call.failed",
  "capitalallocator.retry.scheduled",
  "capitalallocator.fallback.applied",
  "capitalallocator.response.generated"
]);
export type BudgetEventName = z.infer<typeof BudgetEventNameSchema>;

export const BudgetEventSchema = z
  .object({
    details: z
      .object({
        attempt: z.number().int().min(1).optional(),
        errorCode: z.string().min(1).optional(),
        fallbackMode: BudgetFailureModeSchema.optional(),
        maxAttempts: z.number().int().min(1).optional(),
        source: z.string().min(1).optional(),
        toolId: z.string().min(1).optional()
      })
      .strict(),
    level: z.enum(["error", "info", "warning"]),
    message: z.string().min(1),
    name: BudgetEventNameSchema,
    timestamp: z.string().datetime()
  })
  .strict();
export type BudgetEvent = z.infer<typeof BudgetEventSchema>;

export const BudgetMetricsSchema = z
  .object({
    durationMs: z.number().nonnegative(),
    retries: z.number().int().nonnegative(),
    toolCalls: z.number().int().nonnegative(),
    toolFailures: z.number().int().nonnegative()
  })
  .strict();
export type BudgetMetrics = z.infer<typeof BudgetMetricsSchema>;

export const CapitalAllocatorContractSchema = z
  .object({
    failureMode: BudgetFailureModeSchema,
    observability: z
      .object({
        events: z.array(BudgetEventNameSchema).min(1),
        metrics: z
          .array(
            z.enum(["duration_ms", "retries", "tool_calls", "tool_failures"])
          )
          .min(1)
      })
      .strict(),
    retry: z
      .object({
        baseDelayMs: z.number().int().min(1).max(30_000),
        maxAttempts: z.number().int().min(1).max(3)
      })
      .strict(),
    toolIds: z.array(z.string().trim().min(1)).min(1)
  })
  .strict();
export type CapitalAllocatorContract = z.infer<typeof CapitalAllocatorContractSchema>;

export const DEFAULT_BUDGETFLUID_CONTRACT: CapitalAllocatorContract = {
  failureMode: "degraded_report",
  observability: {
    events: [
      "capitalallocator.request.received",
      "capitalallocator.contract.loaded",
      "capitalallocator.tool.call.started",
      "capitalallocator.tool.call.succeeded",
      "capitalallocator.tool.call.failed",
      "capitalallocator.retry.scheduled",
      "capitalallocator.fallback.applied",
      "capitalallocator.response.generated"
    ],
    metrics: ["duration_ms", "tool_calls", "tool_failures", "retries"]
  },
  retry: {
    baseDelayMs: 500,
    maxAttempts: 3
  },
  toolIds: ["spend-telemetry-feed", "forecast-drift-engine", "scenario-stress-feed"]
};

const PrioritySchema = z.enum(["critical", "high", "medium", "low"]);

export const BudgetSignalSchema = z
  .object({
    confidence: z.enum(["high", "medium", "low"]),
    interpretation: z.string().min(1),
    metric: z.string().min(1),
    value: z.number()
  })
  .strict();
export type BudgetSignal = z.infer<typeof BudgetSignalSchema>;

export const BudgetRiskSchema = z
  .object({
    mitigation: z.string().min(1),
    severity: PrioritySchema,
    signal: z.string().min(1)
  })
  .strict();
export type BudgetRisk = z.infer<typeof BudgetRiskSchema>;

export const BudgetActionSchema = z
  .object({
    owner: z.string().min(1),
    priority: PrioritySchema,
    recommendation: z.string().min(1),
    targetDate: isoDateSchema
  })
  .strict();
export type BudgetAction = z.infer<typeof BudgetActionSchema>;

export const CapitalAllocatorOutputSchema = z
  .object({
    agent: z.literal("CapitalAllocator"),
    budgetBrief: z
      .object({
        actions: z.array(BudgetActionSchema),
        headline: z.string().min(1),
        projectedEfficiencyPct: z.number(),
        recommendedReallocationPct: z.number(),
        riskSignals: z.array(BudgetRiskSchema),
        signals: z.array(BudgetSignalSchema)
      })
      .strict(),
    domain: z.literal("executivos"),
    fallback: z
      .object({
        applied: z.boolean(),
        mode: BudgetFailureModeSchema.nullable(),
        reasons: z.array(z.string().min(1))
      })
      .strict(),
    generatedAt: z.string().datetime(),
    observability: z
      .object({
        events: z.array(BudgetEventSchema),
        metrics: BudgetMetricsSchema
      })
      .strict(),
    status: z.enum(["error", "fallback", "success"]),
    summary: z.string().min(1)
  })
  .strict();
export type CapitalAllocatorOutput = z.infer<typeof CapitalAllocatorOutputSchema>;
