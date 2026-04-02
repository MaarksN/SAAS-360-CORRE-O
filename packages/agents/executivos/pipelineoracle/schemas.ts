// [SOURCE] BirthHub360_Agentes_Parallel_Plan - PipelineOracle
import { z } from "zod";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format.");

export const QuotaSegmentSchema = z.enum([
  "commercial",
  "enterprise",
  "mid_market",
  "partners",
  "smb"
]);
export type QuotaSegment = z.infer<typeof QuotaSegmentSchema>;

export const QuotaSectionSchema = z.enum([
  "capacity_model",
  "coverage_gaps",
  "incentive_alignment",
  "ramp_risk",
  "territory_balance"
]);
export type QuotaSection = z.infer<typeof QuotaSectionSchema>;

export const PipelineOracleInputSchema = z
  .object({
    constraints: z
      .object({
        currency: z.string().trim().length(3),
        language: z.enum(["pt-BR", "en-US"]),
        maxActions: z.number().int().min(1).max(12)
      })
      .strict(),
    requestId: z.string().trim().min(1),
    sections: z.array(QuotaSectionSchema).min(1),
    segments: z.array(QuotaSegmentSchema).min(1),
    targetQuotaAttainmentPct: z.number().positive(),
    tenantId: z.string().trim().min(1),
    window: z
      .object({
        endDate: isoDateSchema,
        startDate: isoDateSchema
      })
      .strict()
  })
  .strict();
export type PipelineOracleInput = z.infer<typeof PipelineOracleInputSchema>;

export const QuotaFailureModeSchema = z.enum([
  "degraded_report",
  "human_handoff",
  "hard_fail"
]);
export type QuotaFailureMode = z.infer<typeof QuotaFailureModeSchema>;

export const QuotaEventNameSchema = z.enum([
  "pipelineoracle.request.received",
  "pipelineoracle.contract.loaded",
  "pipelineoracle.tool.call.started",
  "pipelineoracle.tool.call.succeeded",
  "pipelineoracle.tool.call.failed",
  "pipelineoracle.retry.scheduled",
  "pipelineoracle.fallback.applied",
  "pipelineoracle.response.generated"
]);
export type QuotaEventName = z.infer<typeof QuotaEventNameSchema>;

export const QuotaEventSchema = z
  .object({
    details: z
      .object({
        attempt: z.number().int().min(1).optional(),
        errorCode: z.string().min(1).optional(),
        fallbackMode: QuotaFailureModeSchema.optional(),
        maxAttempts: z.number().int().min(1).optional(),
        source: z.string().min(1).optional(),
        toolId: z.string().min(1).optional()
      })
      .strict(),
    level: z.enum(["error", "info", "warning"]),
    message: z.string().min(1),
    name: QuotaEventNameSchema,
    timestamp: z.string().datetime()
  })
  .strict();
export type QuotaEvent = z.infer<typeof QuotaEventSchema>;

export const QuotaMetricsSchema = z
  .object({
    durationMs: z.number().nonnegative(),
    retries: z.number().int().nonnegative(),
    toolCalls: z.number().int().nonnegative(),
    toolFailures: z.number().int().nonnegative()
  })
  .strict();
export type QuotaMetrics = z.infer<typeof QuotaMetricsSchema>;

export const PipelineOracleContractSchema = z
  .object({
    failureMode: QuotaFailureModeSchema,
    observability: z
      .object({
        events: z.array(QuotaEventNameSchema).min(1),
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
export type PipelineOracleContract = z.infer<typeof PipelineOracleContractSchema>;

export const DEFAULT_QUOTAARCHITECT_CONTRACT: PipelineOracleContract = {
  failureMode: "degraded_report",
  observability: {
    events: [
      "pipelineoracle.request.received",
      "pipelineoracle.contract.loaded",
      "pipelineoracle.tool.call.started",
      "pipelineoracle.tool.call.succeeded",
      "pipelineoracle.tool.call.failed",
      "pipelineoracle.retry.scheduled",
      "pipelineoracle.fallback.applied",
      "pipelineoracle.response.generated"
    ],
    metrics: ["duration_ms", "tool_calls", "tool_failures", "retries"]
  },
  retry: {
    baseDelayMs: 500,
    maxAttempts: 3
  },
  toolIds: [
    "capacity-planner-feed",
    "territory-coverage-engine",
    "attainment-variance-feed"
  ]
};

const PrioritySchema = z.enum(["critical", "high", "medium", "low"]);

export const QuotaSignalSchema = z
  .object({
    confidence: z.enum(["high", "medium", "low"]),
    interpretation: z.string().min(1),
    metric: z.string().min(1),
    value: z.number()
  })
  .strict();
export type QuotaSignal = z.infer<typeof QuotaSignalSchema>;

export const QuotaRiskSchema = z
  .object({
    mitigation: z.string().min(1),
    severity: PrioritySchema,
    signal: z.string().min(1)
  })
  .strict();
export type QuotaRisk = z.infer<typeof QuotaRiskSchema>;

export const QuotaActionSchema = z
  .object({
    owner: z.string().min(1),
    priority: PrioritySchema,
    recommendation: z.string().min(1),
    targetDate: isoDateSchema
  })
  .strict();
export type QuotaAction = z.infer<typeof QuotaActionSchema>;

export const PipelineOracleOutputSchema = z
  .object({
    agent: z.literal("PipelineOracle"),
    domain: z.literal("executivos"),
    fallback: z
      .object({
        applied: z.boolean(),
        mode: QuotaFailureModeSchema.nullable(),
        reasons: z.array(z.string().min(1))
      })
      .strict(),
    generatedAt: z.string().datetime(),
    observability: z
      .object({
        events: z.array(QuotaEventSchema),
        metrics: QuotaMetricsSchema
      })
      .strict(),
    quotaBrief: z
      .object({
        actions: z.array(QuotaActionSchema),
        headline: z.string().min(1),
        projectedAttainmentPct: z.number(),
        recommendedQuotaDeltaPct: z.number(),
        riskSignals: z.array(QuotaRiskSchema),
        signals: z.array(QuotaSignalSchema)
      })
      .strict(),
    status: z.enum(["error", "fallback", "success"]),
    summary: z.string().min(1)
  })
  .strict();
export type PipelineOracleOutput = z.infer<typeof PipelineOracleOutputSchema>;
