// [SOURCE] BirthHub360_Agentes_Parallel_Plan - ExpansionMapper
import { z } from "zod";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format.");

export const MarketSegmentSchema = z.enum([
  "enterprise",
  "mid_market",
  "partners",
  "self_serve",
  "smb"
]);
export type MarketSegment = z.infer<typeof MarketSegmentSchema>;

export const MarketSectionSchema = z.enum([
  "category_acceleration",
  "competitor_momentum",
  "content_velocity",
  "emerging_signals",
  "topic_clusters"
]);
export type MarketSection = z.infer<typeof MarketSectionSchema>;

export const ExpansionMapperInputSchema = z
  .object({
    constraints: z
      .object({
        currency: z.string().trim().length(3),
        language: z.enum(["pt-BR", "en-US"]),
        maxActions: z.number().int().min(1).max(12)
      })
      .strict(),
    requestId: z.string().trim().min(1),
    sections: z.array(MarketSectionSchema).min(1),
    segments: z.array(MarketSegmentSchema).min(1),
    targetSignalConfidencePct: z.number().positive(),
    tenantId: z.string().trim().min(1),
    window: z
      .object({
        endDate: isoDateSchema,
        startDate: isoDateSchema
      })
      .strict()
  })
  .strict();
export type ExpansionMapperInput = z.infer<typeof ExpansionMapperInputSchema>;

export const TrendFailureModeSchema = z.enum([
  "degraded_report",
  "human_handoff",
  "hard_fail"
]);
export type TrendFailureMode = z.infer<typeof TrendFailureModeSchema>;

export const MarketEventNameSchema = z.enum([
  "expansionmapper.request.received",
  "expansionmapper.contract.loaded",
  "expansionmapper.tool.call.started",
  "expansionmapper.tool.call.succeeded",
  "expansionmapper.tool.call.failed",
  "expansionmapper.retry.scheduled",
  "expansionmapper.fallback.applied",
  "expansionmapper.response.generated"
]);
export type MarketEventName = z.infer<typeof MarketEventNameSchema>;

export const MarketEventSchema = z
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
    name: MarketEventNameSchema,
    timestamp: z.string().datetime()
  })
  .strict();
export type MarketEvent = z.infer<typeof MarketEventSchema>;

export const MarketMetricsSchema = z
  .object({
    durationMs: z.number().nonnegative(),
    retries: z.number().int().nonnegative(),
    toolCalls: z.number().int().nonnegative(),
    toolFailures: z.number().int().nonnegative()
  })
  .strict();
export type MarketMetrics = z.infer<typeof MarketMetricsSchema>;

export const ExpansionMapperContractSchema = z
  .object({
    failureMode: TrendFailureModeSchema,
    observability: z
      .object({
        events: z.array(MarketEventNameSchema).min(1),
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
export type ExpansionMapperContract = z.infer<typeof ExpansionMapperContractSchema>;

export const DEFAULT_TRENDCATCHER_CONTRACT: ExpansionMapperContract = {
  failureMode: "degraded_report",
  observability: {
    events: [
      "expansionmapper.request.received",
      "expansionmapper.contract.loaded",
      "expansionmapper.tool.call.started",
      "expansionmapper.tool.call.succeeded",
      "expansionmapper.tool.call.failed",
      "expansionmapper.retry.scheduled",
      "expansionmapper.fallback.applied",
      "expansionmapper.response.generated"
    ],
    metrics: ["duration_ms", "tool_calls", "tool_failures", "retries"]
  },
  retry: {
    baseDelayMs: 500,
    maxAttempts: 3
  },
  toolIds: ["market-sentinel-feed", "macro-signal-stream", "risk-opportunity-engine"]
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

export const ExpansionMapperOutputSchema = z
  .object({
    agent: z.literal("ExpansionMapper"),
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
        events: z.array(MarketEventSchema),
        metrics: MarketMetricsSchema
      })
      .strict(),
    status: z.enum(["error", "fallback", "success"]),
    summary: z.string().min(1),
    marketBrief: z
      .object({
        actions: z.array(TrendActionSchema),
        headline: z.string().min(1),
        projectedSignalConfidencePct: z.number(),
        recommendedMonitoringFront: z.string().min(1),
        riskSignals: z.array(TrendRiskSchema),
        signals: z.array(TrendSignalSchema)
      })
      .strict()
  })
  .strict();
export type ExpansionMapperOutput = z.infer<typeof ExpansionMapperOutputSchema>;
