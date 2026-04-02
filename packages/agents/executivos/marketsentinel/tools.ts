// [SOURCE] BirthHub360_Agentes_Parallel_Plan - MarketSentinel
import { createHash } from "node:crypto";

import { z } from "zod";

import { MarketSegmentSchema } from "./schemas.js";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format.");

export const TRENDCATCHER_TOOL_IDS = [
  "market-sentinel-feed",
  "macro-signal-stream",
  "risk-opportunity-engine"
] as const;
export type TrendToolId = (typeof TRENDCATCHER_TOOL_IDS)[number];

export const TrendToolInputSchema = z
  .object({
    endDate: isoDateSchema,
    segments: z.array(MarketSegmentSchema).min(1),
    startDate: isoDateSchema,
    targetSignalConfidencePct: z.number().positive(),
    tenantId: z.string().trim().min(1)
  })
  .strict();
export type TrendToolInput = z.infer<typeof TrendToolInputSchema>;

export const MarketTrendSnapshotSchema = z
  .object({
    dominantTheme: z.string().min(1),
    momentumIndex: z.number().min(0).max(100),
    trendVelocityPct: z.number().min(0).max(100)
  })
  .strict();
export type MarketTrendSnapshot = z.infer<typeof MarketTrendSnapshotSchema>;

export const SocialSignalSnapshotSchema = z
  .object({
    emergingTopic: z.string().min(1),
    engagementLiftPct: z.number().min(0).max(100),
    sentimentShiftPct: z.number().min(-100).max(100)
  })
  .strict();
export type SocialSignalSnapshot = z.infer<typeof SocialSignalSnapshotSchema>;

export const CategoryGrowthSnapshotSchema = z
  .object({
    competitorPressurePct: z.number().min(0).max(100),
    projectedCategoryGrowthPct: z.number().min(0).max(300),
    whitespaceOpportunityPct: z.number().min(0).max(100)
  })
  .strict();
export type CategoryGrowthSnapshot = z.infer<typeof CategoryGrowthSnapshotSchema>;

export interface MarketSentinelToolAdapters {
  fetchCategoryGrowth(input: TrendToolInput): Promise<CategoryGrowthSnapshot>;
  fetchMarketTrends(input: TrendToolInput): Promise<MarketTrendSnapshot>;
  fetchSocialSignals(input: TrendToolInput): Promise<SocialSignalSnapshot>;
}

function deterministic(seed: string, min: number, max: number): number {
  const digest = createHash("sha256").update(seed).digest("hex");
  const parsed = Number.parseInt(digest.slice(0, 10), 16);
  const ratio = parsed / Number.parseInt("ffffffffff", 16);
  return min + (max - min) * ratio;
}

export function normalizeTrendToolId(toolId: string): TrendToolId | null {
  const normalized = toolId
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (normalized === "market-sentinel-feed") {
    return "market-sentinel-feed";
  }
  if (normalized === "macro-signal-stream") {
    return "macro-signal-stream";
  }
  if (normalized === "risk-opportunity-engine") {
    return "risk-opportunity-engine";
  }
  return null;
}

export function createDefaultMarketSentinelToolAdapters(): MarketSentinelToolAdapters {
  return {
    async fetchCategoryGrowth(input: TrendToolInput): Promise<CategoryGrowthSnapshot> {
      TrendToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.targetSignalConfidencePct}:category`;
      return CategoryGrowthSnapshotSchema.parse({
        competitorPressurePct: Number(deterministic(`${seed}:pressure`, 12, 71).toFixed(2)),
        projectedCategoryGrowthPct: Number(
          deterministic(`${seed}:growth`, 9, 84).toFixed(2)
        ),
        whitespaceOpportunityPct: Number(
          deterministic(`${seed}:whitespace`, 18, 88).toFixed(2)
        )
      });
    },

    async fetchMarketTrends(input: TrendToolInput): Promise<MarketTrendSnapshot> {
      TrendToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.startDate}:${input.endDate}:market`;
      return MarketTrendSnapshotSchema.parse({
        dominantTheme:
          deterministic(`${seed}:theme`, 0, 1) > 0.5
            ? "AI workflow orchestration with measurable revenue impact"
            : "cost-efficient automation tied to retention and upsell performance",
        momentumIndex: Number(deterministic(`${seed}:momentum`, 34, 94).toFixed(2)),
        trendVelocityPct: Number(deterministic(`${seed}:velocity`, 16, 83).toFixed(2))
      });
    },

    async fetchSocialSignals(input: TrendToolInput): Promise<SocialSignalSnapshot> {
      TrendToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.segments.join(",")}:social`;
      return SocialSignalSnapshotSchema.parse({
        emergingTopic:
          deterministic(`${seed}:topic`, 0, 1) > 0.5
            ? "go-to-market copilots with proof-of-value in under 30 days"
            : "board-level visibility on CAC-to-payback acceleration",
        engagementLiftPct: Number(deterministic(`${seed}:engagement`, 8, 69).toFixed(2)),
        sentimentShiftPct: Number(deterministic(`${seed}:sentiment`, -24, 29).toFixed(2))
      });
    }
  };
}
