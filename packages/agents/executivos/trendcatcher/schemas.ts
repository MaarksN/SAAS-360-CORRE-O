// [SOURCE] BirthHub360_Agentes_Parallel_Plan - TrendCatcher
import { z } from "zod";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format.");

export const TrendSegmentSchema = z.enum([
  "enterprise",
  "mid_market",
  "partners",
  "self_serve",
  "smb"
]);
export type TrendSegment = z.infer<typeof TrendSegmentSchema>;

export const TrendSectionSchema = z.enum([
  "category_acceleration",
  "competitor_momentum",
  "content_velocity",
  "emerging_signals",
  "topic_clusters"
]);
export type TrendSection = z.infer<typeof TrendSectionSchema>;

export const TrendCatcherInputSchema = z
  .object({
    constraints: z
      .object({
        currency: z.string().trim().length(3),
        language: z.enum(["pt-BR", "en-US"]),
        maxActions: z.number().int().min(1).max(12)
      })
      .strict(),
    requestId: z.string().trim().min(1),
    sections: z.array(TrendSectionSchema).min(1),
    segments: z.array(TrendSegmentSchema).min(1),
    targetGrowthPct: z.number().positive(),
    tenantId: z.string().trim().min(1),
    window: z
      .object({
        endDate: isoDateSchema,
        startDate: isoDateSchema
      })
      .strict()
  })
  .strict();
export type TrendCatcherInput = z.infer<typeof TrendCatcherInputSchema>;

export const TrendFailureModeSchema = z.enum([
  "degraded_report",
  "human_handoff",
  "hard_fail"
]);
export type TrendFailureMode = z.infer<typeof TrendFailureModeSchema>;

export const TrendEventNameSchema = z.enum([
  "trendcatcher.request.received",
  "trendcatcher.contract.loaded",
  "trendcatcher.tool.call.started",
  "trendcatcher.tool.call.succeeded",
  "trendcatcher.tool.call.failed",
  "trendcatcher.retry.scheduled",
  "trendcatcher.fallback.applied",
  "trendcatcher.response.generated"
]);
export type TrendEventName = z.infer<typeof TrendEventNameSchema>;

export const TrendEventSchema = z
  .object({
    details: z
      .object({
        attempt: z.number().int().min(1).optional(),
        errorCode: z.string().min(1).optional(),
        fallbackMode: TrendFailureModeSchema.optional(),
        maxAttempts: z.number().int().min(1).optional(),
        source: z.string().min(1).optional(),
        toolId: z.string().min(1).optional()
      })
      .strict(),
    level: z.enum(["error", "info", "warning"]),
    message: z.string().min(1),
    name: TrendEventNameSchema,
    timestamp: z.string().datetime()
  })
  .strict();
export type TrendEvent = z.infer<typeof TrendEventSchema>;

export const TrendMetricsSchema = z
  .object({
    durationMs: z.number().nonnegative(),
    retries: z.number().int().nonnegative(),
    toolCalls: z.number().int().nonnegative(),
    toolFailures: z.number().int().nonnegative()
  })
  .strict();
export type TrendMetrics = z.infer<typeof TrendMetricsSchema>;

export const TrendCatcherContractSchema = z
  .object({
    failureMode: TrendFailureModeSchema,
    observability: z
      .object({
        events: z.array(TrendEventNameSchema).min(1),
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
export type TrendCatcherContract = z.infer<typeof TrendCatcherContractSchema>;

export const DEFAULT_TRENDCATCHER_CONTRACT: TrendCatcherContract = {
  failureMode: "degraded_report",
  observability: {
    events: [
      "trendcatcher.request.received",
      "trendcatcher.contract.loaded",
      "trendcatcher.tool.call.started",
      "trendcatcher.tool.call.succeeded",
      "trendcatcher.tool.call.failed",
      "trendcatcher.retry.scheduled",
      "trendcatcher.fallback.applied",
      "trendcatcher.response.generated"
    ],
    metrics: ["duration_ms", "tool_calls", "tool_failures", "retries"]
  },
  retry: {
    baseDelayMs: 500,
    maxAttempts: 3
  },
  toolIds: ["market-trend-feed", "social-signal-stream", "category-growth-engine"]
};

const PrioritySchema = z.enum(["critical", "high", "medium", "low"]);

export const TrendSignalSchema = z
  .object({
    confidence: z.enum(["high", "medium", "low"]),
    interpretation: z.string().min(1),
    metric: z.string().min(1),
    value: z.number()
  })
  .strict();
export type TrendSignal = z.infer<typeof TrendSignalSchema>;

export const TrendRiskSchema = z
  .object({
    mitigation: z.string().min(1),
    severity: PrioritySchema,
    signal: z.string().min(1)
  })
  .strict();
export type TrendRisk = z.infer<typeof TrendRiskSchema>;

export const TrendActionSchema = z
  .object({
    owner: z.string().min(1),
    priority: PrioritySchema,
    recommendation: z.string().min(1),
    targetDate: isoDateSchema
  })
  .strict();
export type TrendAction = z.infer<typeof TrendActionSchema>;

export const TrendCatcherOutputSchema = z
  .object({
    agent: z.literal("TrendCatcher"),
    domain: z.literal("executivos"),
    fallback: z
      .object({
        applied: z.boolean(),
        mode: TrendFailureModeSchema.nullable(),
        reasons: z.array(z.string().min(1))
      })
      .strict(),
    generatedAt: z.string().datetime(),
    observability: z
      .object({
        events: z.array(TrendEventSchema),
        metrics: TrendMetricsSchema
      })
      .strict(),
    status: z.enum(["error", "fallback", "success"]),
    summary: z.string().min(1),
    trendBrief: z
      .object({
        actions: z.array(TrendActionSchema),
        headline: z.string().min(1),
        projectedMomentumScore: z.number(),
        recommendedFocusArea: z.string().min(1),
        riskSignals: z.array(TrendRiskSchema),
        signals: z.array(TrendSignalSchema)
      })
      .strict()
  })
  .strict();
export type TrendCatcherOutput = z.infer<typeof TrendCatcherOutputSchema>;
