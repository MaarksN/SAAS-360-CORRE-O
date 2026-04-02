// [SOURCE] BirthHub360_Agentes_Parallel_Plan - ChurnDeflector
import { z } from "zod";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format.");

export const BrandSegmentSchema = z.enum([
  "enterprise",
  "mid_market",
  "partners",
  "smb",
  "strategic_accounts"
]);
export type BrandSegment = z.infer<typeof BrandSegmentSchema>;

export const BrandSectionSchema = z.enum([
  "campaign_exposure",
  "guideline_drift",
  "narrative_consistency",
  "pr_response",
  "reputation_risk"
]);
export type BrandSection = z.infer<typeof BrandSectionSchema>;

export const ChurnDeflectorInputSchema = z
  .object({
    constraints: z
      .object({
        currency: z.string().trim().length(3),
        language: z.enum(["pt-BR", "en-US"]),
        maxActions: z.number().int().min(1).max(12)
      })
      .strict(),
    requestId: z.string().trim().min(1),
    sections: z.array(BrandSectionSchema).min(1),
    segments: z.array(BrandSegmentSchema).min(1),
    targetCultureHealthPct: z.number().min(1).max(100),
    tenantId: z.string().trim().min(1),
    window: z
      .object({
        endDate: isoDateSchema,
        startDate: isoDateSchema
      })
      .strict()
  })
  .strict();
export type ChurnDeflectorInput = z.infer<typeof ChurnDeflectorInputSchema>;

export const BrandFailureModeSchema = z.enum([
  "degraded_report",
  "human_handoff",
  "hard_fail"
]);
export type BrandFailureMode = z.infer<typeof BrandFailureModeSchema>;

export const BrandEventNameSchema = z.enum([
  "churndeflector.request.received",
  "churndeflector.contract.loaded",
  "churndeflector.tool.call.started",
  "churndeflector.tool.call.succeeded",
  "churndeflector.tool.call.failed",
  "churndeflector.retry.scheduled",
  "churndeflector.fallback.applied",
  "churndeflector.response.generated"
]);
export type BrandEventName = z.infer<typeof BrandEventNameSchema>;

export const BrandEventSchema = z
  .object({
    details: z
      .object({
        attempt: z.number().int().min(1).optional(),
        errorCode: z.string().min(1).optional(),
        fallbackMode: BrandFailureModeSchema.optional(),
        maxAttempts: z.number().int().min(1).optional(),
        source: z.string().min(1).optional(),
        toolId: z.string().min(1).optional()
      })
      .strict(),
    level: z.enum(["error", "info", "warning"]),
    message: z.string().min(1),
    name: BrandEventNameSchema,
    timestamp: z.string().datetime()
  })
  .strict();
export type BrandEvent = z.infer<typeof BrandEventSchema>;

export const BrandMetricsSchema = z
  .object({
    durationMs: z.number().nonnegative(),
    retries: z.number().int().nonnegative(),
    toolCalls: z.number().int().nonnegative(),
    toolFailures: z.number().int().nonnegative()
  })
  .strict();
export type BrandMetrics = z.infer<typeof BrandMetricsSchema>;

export const ChurnDeflectorContractSchema = z
  .object({
    failureMode: BrandFailureModeSchema,
    observability: z
      .object({
        events: z.array(BrandEventNameSchema).min(1),
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
export type ChurnDeflectorContract = z.infer<typeof ChurnDeflectorContractSchema>;

export const DEFAULT_BRANDGUARDIAN_CONTRACT: ChurnDeflectorContract = {
  failureMode: "degraded_report",
  observability: {
    events: [
      "churndeflector.request.received",
      "churndeflector.contract.loaded",
      "churndeflector.tool.call.started",
      "churndeflector.tool.call.succeeded",
      "churndeflector.tool.call.failed",
      "churndeflector.retry.scheduled",
      "churndeflector.fallback.applied",
      "churndeflector.response.generated"
    ],
    metrics: ["duration_ms", "tool_calls", "tool_failures", "retries"]
  },
  retry: {
    baseDelayMs: 500,
    maxAttempts: 3
  },
  toolIds: ["brand-sentiment-feed", "guideline-compliance-engine", "pr-incident-monitor"]
};

const PrioritySchema = z.enum(["critical", "high", "medium", "low"]);

export const BrandSignalSchema = z
  .object({
    confidence: z.enum(["high", "medium", "low"]),
    interpretation: z.string().min(1),
    metric: z.string().min(1),
    value: z.number()
  })
  .strict();
export type BrandSignal = z.infer<typeof BrandSignalSchema>;

export const BrandRiskSchema = z
  .object({
    mitigation: z.string().min(1),
    severity: PrioritySchema,
    signal: z.string().min(1)
  })
  .strict();
export type BrandRisk = z.infer<typeof BrandRiskSchema>;

export const BrandActionSchema = z
  .object({
    owner: z.string().min(1),
    priority: PrioritySchema,
    recommendation: z.string().min(1),
    targetDate: isoDateSchema
  })
  .strict();
export type BrandAction = z.infer<typeof BrandActionSchema>;

export const ChurnDeflectorOutputSchema = z
  .object({
    agent: z.literal("ChurnDeflector"),
    cultureBrief: z
      .object({
        actions: z.array(BrandActionSchema),
        headline: z.string().min(1),
        projectedCultureHealthScore: z.number(),
        riskSignals: z.array(BrandRiskSchema),
        signals: z.array(BrandSignalSchema)
      })
      .strict(),
    domain: z.literal("executivos"),
    fallback: z
      .object({
        applied: z.boolean(),
        mode: BrandFailureModeSchema.nullable(),
        reasons: z.array(z.string().min(1))
      })
      .strict(),
    generatedAt: z.string().datetime(),
    observability: z
      .object({
        events: z.array(BrandEventSchema),
        metrics: BrandMetricsSchema
      })
      .strict(),
    status: z.enum(["error", "fallback", "success"]),
    summary: z.string().min(1)
  })
  .strict();
export type ChurnDeflectorOutput = z.infer<typeof ChurnDeflectorOutputSchema>;
