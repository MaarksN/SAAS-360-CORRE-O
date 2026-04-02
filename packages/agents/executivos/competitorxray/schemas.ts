// [SOURCE] BirthHub360_Agentes_Parallel_Plan - CompetitorX-Ray
import { z } from "zod";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format.");

export const CompetitorSegmentSchema = z.enum([
  "enterprise",
  "mid_market",
  "partners",
  "smb",
  "strategic_accounts"
]);
export type CompetitorSegment = z.infer<typeof CompetitorSegmentSchema>;

export const CompetitorSectionSchema = z.enum([
  "battlecards",
  "feature_gaps",
  "pricing_benchmarks",
  "threat_signals",
  "win_loss_patterns"
]);
export type CompetitorSection = z.infer<typeof CompetitorSectionSchema>;

export const CompetitorXRayInputSchema = z
  .object({
    constraints: z
      .object({
        currency: z.string().trim().length(3),
        language: z.enum(["pt-BR", "en-US"]),
        maxActions: z.number().int().min(1).max(12)
      })
      .strict(),
    requestId: z.string().trim().min(1),
    sections: z.array(CompetitorSectionSchema).min(1),
    segments: z.array(CompetitorSegmentSchema).min(1),
    targetWinRateLiftPct: z.number().min(1).max(100),
    tenantId: z.string().trim().min(1),
    window: z
      .object({
        endDate: isoDateSchema,
        startDate: isoDateSchema
      })
      .strict()
  })
  .strict();
export type CompetitorXRayInput = z.infer<typeof CompetitorXRayInputSchema>;

export const CompetitorFailureModeSchema = z.enum([
  "degraded_report",
  "human_handoff",
  "hard_fail"
]);
export type CompetitorFailureMode = z.infer<typeof CompetitorFailureModeSchema>;

export const CompetitorEventNameSchema = z.enum([
  "competitorxray.request.received",
  "competitorxray.contract.loaded",
  "competitorxray.tool.call.started",
  "competitorxray.tool.call.succeeded",
  "competitorxray.tool.call.failed",
  "competitorxray.retry.scheduled",
  "competitorxray.fallback.applied",
  "competitorxray.response.generated"
]);
export type CompetitorEventName = z.infer<typeof CompetitorEventNameSchema>;

export const CompetitorEventSchema = z
  .object({
    details: z
      .object({
        attempt: z.number().int().min(1).optional(),
        errorCode: z.string().min(1).optional(),
        fallbackMode: CompetitorFailureModeSchema.optional(),
        maxAttempts: z.number().int().min(1).optional(),
        source: z.string().min(1).optional(),
        toolId: z.string().min(1).optional()
      })
      .strict(),
    level: z.enum(["error", "info", "warning"]),
    message: z.string().min(1),
    name: CompetitorEventNameSchema,
    timestamp: z.string().datetime()
  })
  .strict();
export type CompetitorEvent = z.infer<typeof CompetitorEventSchema>;

export const CompetitorMetricsSchema = z
  .object({
    durationMs: z.number().nonnegative(),
    retries: z.number().int().nonnegative(),
    toolCalls: z.number().int().nonnegative(),
    toolFailures: z.number().int().nonnegative()
  })
  .strict();
export type CompetitorMetrics = z.infer<typeof CompetitorMetricsSchema>;

export const CompetitorXRayContractSchema = z
  .object({
    failureMode: CompetitorFailureModeSchema,
    observability: z
      .object({
        events: z.array(CompetitorEventNameSchema).min(1),
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
export type CompetitorXRayContract = z.infer<typeof CompetitorXRayContractSchema>;

export const DEFAULT_COMPETITORXRAY_CONTRACT: CompetitorXRayContract = {
  failureMode: "degraded_report",
  observability: {
    events: [
      "competitorxray.request.received",
      "competitorxray.contract.loaded",
      "competitorxray.tool.call.started",
      "competitorxray.tool.call.succeeded",
      "competitorxray.tool.call.failed",
      "competitorxray.retry.scheduled",
      "competitorxray.fallback.applied",
      "competitorxray.response.generated"
    ],
    metrics: ["duration_ms", "tool_calls", "tool_failures", "retries"]
  },
  retry: {
    baseDelayMs: 500,
    maxAttempts: 3
  },
  toolIds: [
    "competitor-intel-feed",
    "pricing-benchmark-engine",
    "feature-gap-analyzer"
  ]
};

const PrioritySchema = z.enum(["critical", "high", "medium", "low"]);

export const CompetitorSignalSchema = z
  .object({
    confidence: z.enum(["high", "medium", "low"]),
    interpretation: z.string().min(1),
    metric: z.string().min(1),
    value: z.number()
  })
  .strict();
export type CompetitorSignal = z.infer<typeof CompetitorSignalSchema>;

export const CompetitorRiskSchema = z
  .object({
    mitigation: z.string().min(1),
    severity: PrioritySchema,
    signal: z.string().min(1)
  })
  .strict();
export type CompetitorRisk = z.infer<typeof CompetitorRiskSchema>;

export const CompetitorActionSchema = z
  .object({
    owner: z.string().min(1),
    priority: PrioritySchema,
    recommendation: z.string().min(1),
    targetDate: isoDateSchema
  })
  .strict();
export type CompetitorAction = z.infer<typeof CompetitorActionSchema>;

export const CompetitorXRayOutputSchema = z
  .object({
    agent: z.literal("CompetitorXRay"),
    competitorBrief: z
      .object({
        actions: z.array(CompetitorActionSchema),
        headline: z.string().min(1),
        projectedWinRateLiftPct: z.number(),
        recommendedBattlefront: z.string().min(1),
        riskSignals: z.array(CompetitorRiskSchema),
        signals: z.array(CompetitorSignalSchema)
      })
      .strict(),
    domain: z.literal("executivos"),
    fallback: z
      .object({
        applied: z.boolean(),
        mode: CompetitorFailureModeSchema.nullable(),
        reasons: z.array(z.string().min(1))
      })
      .strict(),
    generatedAt: z.string().datetime(),
    observability: z
      .object({
        events: z.array(CompetitorEventSchema),
        metrics: CompetitorMetricsSchema
      })
      .strict(),
    status: z.enum(["error", "fallback", "success"]),
    summary: z.string().min(1)
  })
  .strict();
export type CompetitorXRayOutput = z.infer<typeof CompetitorXRayOutputSchema>;
