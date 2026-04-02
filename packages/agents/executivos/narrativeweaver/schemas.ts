// [SOURCE] BirthHub360_Agentes_Parallel_Plan - NarrativeWeaver
import { z } from "zod";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format.");

export const NarrativeAudienceSchema = z.enum([
  "board",
  "finance_committee",
  "investors",
  "leadership_team",
  "regional_vps"
]);
export type NarrativeAudience = z.infer<typeof NarrativeAudienceSchema>;

export const NarrativeSectionSchema = z.enum([
  "board_narrative",
  "earnings_storyline",
  "execution_proof",
  "risk_disclosure",
  "strategy_alignment"
]);
export type NarrativeSection = z.infer<typeof NarrativeSectionSchema>;

export const NarrativeWeaverInputSchema = z
  .object({
    audiences: z.array(NarrativeAudienceSchema).min(1),
    constraints: z
      .object({
        currency: z.string().trim().length(3),
        language: z.enum(["pt-BR", "en-US"]),
        maxActions: z.number().int().min(1).max(12)
      })
      .strict(),
    requestId: z.string().trim().min(1),
    sections: z.array(NarrativeSectionSchema).min(1),
    targetClarityScorePct: z.number().min(1).max(100),
    tenantId: z.string().trim().min(1),
    window: z
      .object({
        endDate: isoDateSchema,
        startDate: isoDateSchema
      })
      .strict()
  })
  .strict();
export type NarrativeWeaverInput = z.infer<typeof NarrativeWeaverInputSchema>;

export const NarrativeFailureModeSchema = z.enum([
  "degraded_report",
  "human_handoff",
  "hard_fail"
]);
export type NarrativeFailureMode = z.infer<typeof NarrativeFailureModeSchema>;

export const NarrativeEventNameSchema = z.enum([
  "narrativeweaver.request.received",
  "narrativeweaver.contract.loaded",
  "narrativeweaver.tool.call.started",
  "narrativeweaver.tool.call.succeeded",
  "narrativeweaver.tool.call.failed",
  "narrativeweaver.retry.scheduled",
  "narrativeweaver.fallback.applied",
  "narrativeweaver.response.generated"
]);
export type NarrativeEventName = z.infer<typeof NarrativeEventNameSchema>;

export const NarrativeEventSchema = z
  .object({
    details: z
      .object({
        attempt: z.number().int().min(1).optional(),
        errorCode: z.string().min(1).optional(),
        fallbackMode: NarrativeFailureModeSchema.optional(),
        maxAttempts: z.number().int().min(1).optional(),
        source: z.string().min(1).optional(),
        toolId: z.string().min(1).optional()
      })
      .strict(),
    level: z.enum(["error", "info", "warning"]),
    message: z.string().min(1),
    name: NarrativeEventNameSchema,
    timestamp: z.string().datetime()
  })
  .strict();
export type NarrativeEvent = z.infer<typeof NarrativeEventSchema>;

export const NarrativeMetricsSchema = z
  .object({
    durationMs: z.number().nonnegative(),
    retries: z.number().int().nonnegative(),
    toolCalls: z.number().int().nonnegative(),
    toolFailures: z.number().int().nonnegative()
  })
  .strict();
export type NarrativeMetrics = z.infer<typeof NarrativeMetricsSchema>;

export const NarrativeWeaverContractSchema = z
  .object({
    failureMode: NarrativeFailureModeSchema,
    observability: z
      .object({
        events: z.array(NarrativeEventNameSchema).min(1),
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
export type NarrativeWeaverContract = z.infer<typeof NarrativeWeaverContractSchema>;

export const DEFAULT_NARRATIVEWEAVER_CONTRACT: NarrativeWeaverContract = {
  failureMode: "degraded_report",
  observability: {
    events: [
      "narrativeweaver.request.received",
      "narrativeweaver.contract.loaded",
      "narrativeweaver.tool.call.started",
      "narrativeweaver.tool.call.succeeded",
      "narrativeweaver.tool.call.failed",
      "narrativeweaver.retry.scheduled",
      "narrativeweaver.fallback.applied",
      "narrativeweaver.response.generated"
    ],
    metrics: ["duration_ms", "tool_calls", "tool_failures", "retries"]
  },
  retry: {
    baseDelayMs: 500,
    maxAttempts: 3
  },
  toolIds: [
    "earnings-signal-feed",
    "stakeholder-sentiment-stream",
    "strategy-coherence-engine"
  ]
};

const PrioritySchema = z.enum(["critical", "high", "medium", "low"]);

export const NarrativeSignalSchema = z
  .object({
    confidence: z.enum(["high", "medium", "low"]),
    interpretation: z.string().min(1),
    metric: z.string().min(1),
    value: z.number()
  })
  .strict();
export type NarrativeSignal = z.infer<typeof NarrativeSignalSchema>;

export const NarrativeRiskSchema = z
  .object({
    mitigation: z.string().min(1),
    severity: PrioritySchema,
    signal: z.string().min(1)
  })
  .strict();
export type NarrativeRisk = z.infer<typeof NarrativeRiskSchema>;

export const NarrativeActionSchema = z
  .object({
    owner: z.string().min(1),
    priority: PrioritySchema,
    recommendation: z.string().min(1),
    targetDate: isoDateSchema
  })
  .strict();
export type NarrativeAction = z.infer<typeof NarrativeActionSchema>;

export const NarrativeWeaverOutputSchema = z
  .object({
    agent: z.literal("NarrativeWeaver"),
    domain: z.literal("executivos"),
    fallback: z
      .object({
        applied: z.boolean(),
        mode: NarrativeFailureModeSchema.nullable(),
        reasons: z.array(z.string().min(1))
      })
      .strict(),
    generatedAt: z.string().datetime(),
    narrativeBrief: z
      .object({
        actions: z.array(NarrativeActionSchema),
        headline: z.string().min(1),
        projectedClarityScorePct: z.number(),
        recommendedNarrativeTheme: z.string().min(1),
        riskSignals: z.array(NarrativeRiskSchema),
        signals: z.array(NarrativeSignalSchema)
      })
      .strict(),
    observability: z
      .object({
        events: z.array(NarrativeEventSchema),
        metrics: NarrativeMetricsSchema
      })
      .strict(),
    status: z.enum(["error", "fallback", "success"]),
    summary: z.string().min(1)
  })
  .strict();
export type NarrativeWeaverOutput = z.infer<typeof NarrativeWeaverOutputSchema>;
