// [SOURCE] BirthHub360_Agentes_Parallel_Plan - PricingOptimizer
import { createHash } from "node:crypto";

import { z } from "zod";

import { CompetitorSegmentSchema } from "./schemas.js";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format.");

export const COMPETITORXRAY_TOOL_IDS = [
  "competitor-intel-feed",
  "pricing-benchmark-engine",
  "feature-gap-analyzer"
] as const;
export type CompetitorToolId = (typeof COMPETITORXRAY_TOOL_IDS)[number];

export const CompetitorToolInputSchema = z
  .object({
    endDate: isoDateSchema,
    segments: z.array(CompetitorSegmentSchema).min(1),
    startDate: isoDateSchema,
    targetWinRateLiftPct: z.number().min(1).max(100),
    tenantId: z.string().trim().min(1)
  })
  .strict();
export type CompetitorToolInput = z.infer<typeof CompetitorToolInputSchema>;

export const CompetitorIntelSnapshotSchema = z
  .object({
    aggressiveMover: z.string().min(1),
    displacementPressurePct: z.number().min(0).max(100),
    strategicThreatIndex: z.number().min(0).max(100)
  })
  .strict();
export type CompetitorIntelSnapshot = z.infer<typeof CompetitorIntelSnapshotSchema>;

export const PricingBenchmarkSnapshotSchema = z
  .object({
    discountGapPct: z.number().min(-100).max(100),
    premiumJustificationScore: z.number().min(0).max(100),
    priceElasticityRiskPct: z.number().min(0).max(100)
  })
  .strict();
export type PricingBenchmarkSnapshot = z.infer<
  typeof PricingBenchmarkSnapshotSchema
>;

export const FeatureGapSnapshotSchema = z
  .object({
    differentiationScore: z.number().min(0).max(100),
    highestGapTheme: z.string().min(1),
    parityCoveragePct: z.number().min(0).max(100)
  })
  .strict();
export type FeatureGapSnapshot = z.infer<typeof FeatureGapSnapshotSchema>;

export interface PricingOptimizerToolAdapters {
  fetchCompetitorIntel(input: CompetitorToolInput): Promise<CompetitorIntelSnapshot>;
  fetchFeatureGap(input: CompetitorToolInput): Promise<FeatureGapSnapshot>;
  fetchPricingBenchmark(
    input: CompetitorToolInput
  ): Promise<PricingBenchmarkSnapshot>;
}

function deterministic(seed: string, min: number, max: number): number {
  const digest = createHash("sha256").update(seed).digest("hex");
  const parsed = Number.parseInt(digest.slice(0, 10), 16);
  const ratio = parsed / Number.parseInt("ffffffffff", 16);
  return min + (max - min) * ratio;
}

export function normalizeCompetitorToolId(toolId: string): CompetitorToolId | null {
  const normalized = toolId
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (normalized === "competitor-intel-feed") {
    return "competitor-intel-feed";
  }
  if (normalized === "pricing-benchmark-engine") {
    return "pricing-benchmark-engine";
  }
  if (normalized === "feature-gap-analyzer") {
    return "feature-gap-analyzer";
  }
  return null;
}

export function createDefaultPricingOptimizerToolAdapters(): PricingOptimizerToolAdapters {
  return {
    async fetchCompetitorIntel(
      input: CompetitorToolInput
    ): Promise<CompetitorIntelSnapshot> {
      CompetitorToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.startDate}:${input.endDate}:intel`;
      return CompetitorIntelSnapshotSchema.parse({
        aggressiveMover:
          deterministic(`${seed}:mover`, 0, 1) > 0.5
            ? "vertical suite challenger with aggressive bundle pricing"
            : "incumbent platform expanding via partner-led migration offers",
        displacementPressurePct: Number(
          deterministic(`${seed}:pressure`, 18, 76).toFixed(2)
        ),
        strategicThreatIndex: Number(
          deterministic(`${seed}:threat`, 21, 89).toFixed(2)
        )
      });
    },

    async fetchFeatureGap(input: CompetitorToolInput): Promise<FeatureGapSnapshot> {
      CompetitorToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.segments.join(",")}:feature-gap`;
      return FeatureGapSnapshotSchema.parse({
        differentiationScore: Number(
          deterministic(`${seed}:differentiation`, 24, 91).toFixed(2)
        ),
        highestGapTheme:
          deterministic(`${seed}:theme`, 0, 1) > 0.5
            ? "enterprise governance automation with auditable workflows"
            : "AI-assisted onboarding speed with reduced time-to-value",
        parityCoveragePct: Number(deterministic(`${seed}:parity`, 22, 88).toFixed(2))
      });
    },

    async fetchPricingBenchmark(
      input: CompetitorToolInput
    ): Promise<PricingBenchmarkSnapshot> {
      CompetitorToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.targetWinRateLiftPct}:pricing`;
      return PricingBenchmarkSnapshotSchema.parse({
        discountGapPct: Number(deterministic(`${seed}:discount`, -19, 24).toFixed(2)),
        premiumJustificationScore: Number(
          deterministic(`${seed}:premium`, 27, 89).toFixed(2)
        ),
        priceElasticityRiskPct: Number(
          deterministic(`${seed}:elasticity`, 9, 61).toFixed(2)
        )
      });
    }
  };
}
