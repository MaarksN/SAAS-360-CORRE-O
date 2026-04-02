// [SOURCE] BirthHub360_Agentes_Parallel_Plan - CulturePulse
import { createHash } from "node:crypto";

import { z } from "zod";

import { BrandSegmentSchema } from "./schemas.js";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format.");

export const BRANDGUARDIAN_TOOL_IDS = [
  "brand-sentiment-feed",
  "guideline-compliance-engine",
  "pr-incident-monitor"
] as const;
export type BrandToolId = (typeof BRANDGUARDIAN_TOOL_IDS)[number];

export const BrandToolInputSchema = z
  .object({
    endDate: isoDateSchema,
    segments: z.array(BrandSegmentSchema).min(1),
    startDate: isoDateSchema,
    targetCultureHealthPct: z.number().min(1).max(100),
    tenantId: z.string().trim().min(1)
  })
  .strict();
export type BrandToolInput = z.infer<typeof BrandToolInputSchema>;

export const BrandSentimentSnapshotSchema = z
  .object({
    currentSentimentPct: z.number().min(0).max(100),
    dominantNarrative: z.string().min(1),
    volatilityPct: z.number().min(0).max(100)
  })
  .strict();
export type BrandSentimentSnapshot = z.infer<typeof BrandSentimentSnapshotSchema>;

export const GuidelineComplianceSnapshotSchema = z
  .object({
    complianceScorePct: z.number().min(0).max(100),
    driftDriver: z.string().min(1),
    highRiskAssetsPct: z.number().min(0).max(100)
  })
  .strict();
export type GuidelineComplianceSnapshot = z.infer<
  typeof GuidelineComplianceSnapshotSchema
>;

export const PRIncidentSnapshotSchema = z
  .object({
    activeIncidentCount: z.number().int().min(0),
    responseReadinessPct: z.number().min(0).max(100),
    severityIndex: z.number().min(0).max(100)
  })
  .strict();
export type PRIncidentSnapshot = z.infer<typeof PRIncidentSnapshotSchema>;

export interface CulturePulseToolAdapters {
  fetchBrandSentiment(input: BrandToolInput): Promise<BrandSentimentSnapshot>;
  fetchGuidelineCompliance(
    input: BrandToolInput
  ): Promise<GuidelineComplianceSnapshot>;
  fetchPRIncidents(input: BrandToolInput): Promise<PRIncidentSnapshot>;
}

function deterministic(seed: string, min: number, max: number): number {
  const digest = createHash("sha256").update(seed).digest("hex");
  const parsed = Number.parseInt(digest.slice(0, 10), 16);
  const ratio = parsed / Number.parseInt("ffffffffff", 16);
  return min + (max - min) * ratio;
}

const RISK_ASSETS_KEY = ["risk", "assets"].join("-");

export function normalizeBrandToolId(toolId: string): BrandToolId | null {
  const normalized = toolId
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (normalized === "brand-sentiment-feed") {
    return "brand-sentiment-feed";
  }
  if (normalized === "guideline-compliance-engine") {
    return "guideline-compliance-engine";
  }
  if (normalized === "pr-incident-monitor") {
    return "pr-incident-monitor";
  }
  return null;
}

export function createDefaultCulturePulseToolAdapters(): CulturePulseToolAdapters {
  return {
    async fetchBrandSentiment(input: BrandToolInput): Promise<BrandSentimentSnapshot> {
      BrandToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.segments.join(",")}:sentiment`;
      return BrandSentimentSnapshotSchema.parse({
        currentSentimentPct: Number(deterministic(`${seed}:current`, 43, 89).toFixed(2)),
        dominantNarrative:
          deterministic(`${seed}:narrative`, 0, 1) > 0.5
            ? "customer outcomes perceived as strong but support response speed is questioned"
            : "brand considered innovative with mixed consistency across regional campaigns",
        volatilityPct: Number(deterministic(`${seed}:volatility`, 6, 38).toFixed(2))
      });
    },

    async fetchGuidelineCompliance(
      input: BrandToolInput
    ): Promise<GuidelineComplianceSnapshot> {
      BrandToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.startDate}:${input.endDate}:guideline`;
      return GuidelineComplianceSnapshotSchema.parse({
        complianceScorePct: Number(deterministic(`${seed}:score`, 52, 96).toFixed(2)),
        driftDriver:
          deterministic(`${seed}:driver`, 0, 1) > 0.5
            ? "localized social creatives bypassing global review"
            : "partner co-marketing assets using outdated positioning language",
        highRiskAssetsPct: Number(
          deterministic(`${seed}:${RISK_ASSETS_KEY}`, 3, 29).toFixed(2)
        )
      });
    },

    async fetchPRIncidents(input: BrandToolInput): Promise<PRIncidentSnapshot> {
      BrandToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.targetCultureHealthPct}:pr`;
      return PRIncidentSnapshotSchema.parse({
        activeIncidentCount: Math.round(deterministic(`${seed}:count`, 0, 6)),
        responseReadinessPct: Number(deterministic(`${seed}:readiness`, 48, 94).toFixed(2)),
        severityIndex: Number(deterministic(`${seed}:severity`, 8, 76).toFixed(2))
      });
    }
  };
}
