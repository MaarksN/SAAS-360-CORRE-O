// [SOURCE] BirthHub360_Agentes_Parallel_Plan - NarrativeWeaver
import { createHash } from "node:crypto";

import { z } from "zod";

import { NarrativeAudienceSchema } from "./schemas.js";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format.");

export const NARRATIVEWEAVER_TOOL_IDS = [
  "earnings-signal-feed",
  "stakeholder-sentiment-stream",
  "strategy-coherence-engine"
] as const;
export type NarrativeToolId = (typeof NARRATIVEWEAVER_TOOL_IDS)[number];

export const NarrativeToolInputSchema = z
  .object({
    audiences: z.array(NarrativeAudienceSchema).min(1),
    endDate: isoDateSchema,
    startDate: isoDateSchema,
    targetClarityScorePct: z.number().min(1).max(100),
    tenantId: z.string().trim().min(1)
  })
  .strict();
export type NarrativeToolInput = z.infer<typeof NarrativeToolInputSchema>;

export const EarningsSignalSnapshotSchema = z
  .object({
    dominantDriver: z.string().min(1),
    guidanceConfidencePct: z.number().min(0).max(100),
    varianceNarrativeRiskPct: z.number().min(0).max(100)
  })
  .strict();
export type EarningsSignalSnapshot = z.infer<typeof EarningsSignalSnapshotSchema>;

export const StakeholderSentimentSnapshotSchema = z
  .object({
    boardAlignmentPct: z.number().min(0).max(100),
    concernTopic: z.string().min(1),
    investorConfidenceShiftPct: z.number().min(-100).max(100)
  })
  .strict();
export type StakeholderSentimentSnapshot = z.infer<
  typeof StakeholderSentimentSnapshotSchema
>;

export const StrategyCoherenceSnapshotSchema = z
  .object({
    executionCredibilityPct: z.number().min(0).max(100),
    messageConsistencyPct: z.number().min(0).max(100),
    narrativeGapPct: z.number().min(0).max(100)
  })
  .strict();
export type StrategyCoherenceSnapshot = z.infer<
  typeof StrategyCoherenceSnapshotSchema
>;

export interface NarrativeWeaverToolAdapters {
  fetchEarningsSignal(input: NarrativeToolInput): Promise<EarningsSignalSnapshot>;
  fetchStakeholderSentiment(
    input: NarrativeToolInput
  ): Promise<StakeholderSentimentSnapshot>;
  fetchStrategyCoherence(
    input: NarrativeToolInput
  ): Promise<StrategyCoherenceSnapshot>;
}

function deterministic(seed: string, min: number, max: number): number {
  const digest = createHash("sha256").update(seed).digest("hex");
  const parsed = Number.parseInt(digest.slice(0, 10), 16);
  const ratio = parsed / Number.parseInt("ffffffffff", 16);
  return min + (max - min) * ratio;
}

export function normalizeNarrativeToolId(toolId: string): NarrativeToolId | null {
  const normalized = toolId
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (normalized === "earnings-signal-feed") {
    return "earnings-signal-feed";
  }
  if (normalized === "stakeholder-sentiment-stream") {
    return "stakeholder-sentiment-stream";
  }
  if (normalized === "strategy-coherence-engine") {
    return "strategy-coherence-engine";
  }
  return null;
}

export function createDefaultNarrativeWeaverToolAdapters(): NarrativeWeaverToolAdapters {
  return {
    async fetchEarningsSignal(
      input: NarrativeToolInput
    ): Promise<EarningsSignalSnapshot> {
      NarrativeToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.startDate}:${input.endDate}:earnings`;
      return EarningsSignalSnapshotSchema.parse({
        dominantDriver:
          deterministic(`${seed}:driver`, 0, 1) > 0.5
            ? "expansion efficiency improving with stronger gross margin discipline"
            : "pipeline quality improving while churn pressure is stabilizing",
        guidanceConfidencePct: Number(
          deterministic(`${seed}:guidance`, 38, 92).toFixed(2)
        ),
        varianceNarrativeRiskPct: Number(
          deterministic(`${seed}:risk`, 11, 57).toFixed(2)
        )
      });
    },

    async fetchStakeholderSentiment(
      input: NarrativeToolInput
    ): Promise<StakeholderSentimentSnapshot> {
      NarrativeToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.audiences.join(",")}:stakeholders`;
      return StakeholderSentimentSnapshotSchema.parse({
        boardAlignmentPct: Number(deterministic(`${seed}:alignment`, 34, 93).toFixed(2)),
        concernTopic:
          deterministic(`${seed}:topic`, 0, 1) > 0.5
            ? "cash conversion timing under aggressive growth commitments"
            : "execution bandwidth to sustain cross-regional rollouts",
        investorConfidenceShiftPct: Number(
          deterministic(`${seed}:shift`, -18, 27).toFixed(2)
        )
      });
    },

    async fetchStrategyCoherence(
      input: NarrativeToolInput
    ): Promise<StrategyCoherenceSnapshot> {
      NarrativeToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.targetClarityScorePct}:coherence`;
      return StrategyCoherenceSnapshotSchema.parse({
        executionCredibilityPct: Number(
          deterministic(`${seed}:credibility`, 41, 95).toFixed(2)
        ),
        messageConsistencyPct: Number(
          deterministic(`${seed}:consistency`, 36, 96).toFixed(2)
        ),
        narrativeGapPct: Number(deterministic(`${seed}:gap`, 8, 49).toFixed(2))
      });
    }
  };
}
