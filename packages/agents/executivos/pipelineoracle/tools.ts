// [SOURCE] BirthHub360_Agentes_Parallel_Plan - PipelineOracle
import { createHash } from "node:crypto";

import { z } from "zod";

import { QuotaSegmentSchema } from "./schemas.js";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format.");

export const QUOTAARCHITECT_TOOL_IDS = [
  "capacity-planner-feed",
  "territory-coverage-engine",
  "attainment-variance-feed"
] as const;
export type QuotaToolId = (typeof QUOTAARCHITECT_TOOL_IDS)[number];

export const QuotaToolInputSchema = z
  .object({
    endDate: isoDateSchema,
    segments: z.array(QuotaSegmentSchema).min(1),
    startDate: isoDateSchema,
    targetQuotaAttainmentPct: z.number().positive(),
    tenantId: z.string().trim().min(1)
  })
  .strict();
export type QuotaToolInput = z.infer<typeof QuotaToolInputSchema>;

export const CapacityPlannerSnapshotSchema = z
  .object({
    availableSellingCapacityPct: z.number().min(0).max(100),
    hiringReadinessPct: z.number().min(0).max(100),
    rampRiskPct: z.number().min(0).max(100)
  })
  .strict();
export type CapacityPlannerSnapshot = z.infer<typeof CapacityPlannerSnapshotSchema>;

export const TerritoryCoverageSnapshotSchema = z
  .object({
    coverageBalanceIndex: z.number().min(0).max(100),
    overloadedTerritoriesPct: z.number().min(0).max(100),
    whitespacePressurePct: z.number().min(0).max(100)
  })
  .strict();
export type TerritoryCoverageSnapshot = z.infer<
  typeof TerritoryCoverageSnapshotSchema
>;

export const AttainmentVarianceSnapshotSchema = z
  .object({
    projectedAttainmentPct: z.number().min(0).max(300),
    topVarianceDriver: z.string().min(1),
    varianceToPlanPct: z.number().min(-100).max(100)
  })
  .strict();
export type AttainmentVarianceSnapshot = z.infer<
  typeof AttainmentVarianceSnapshotSchema
>;

export interface PipelineOracleToolAdapters {
  fetchAttainmentVariance(input: QuotaToolInput): Promise<AttainmentVarianceSnapshot>;
  fetchCapacityPlanner(input: QuotaToolInput): Promise<CapacityPlannerSnapshot>;
  fetchTerritoryCoverage(input: QuotaToolInput): Promise<TerritoryCoverageSnapshot>;
}

function deterministic(seed: string, min: number, max: number): number {
  const digest = createHash("sha256").update(seed).digest("hex");
  const parsed = Number.parseInt(digest.slice(0, 10), 16);
  const ratio = parsed / Number.parseInt("ffffffffff", 16);
  return min + (max - min) * ratio;
}

export function normalizeQuotaToolId(toolId: string): QuotaToolId | null {
  const normalized = toolId
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (normalized === "capacity-planner-feed") {
    return "capacity-planner-feed";
  }
  if (normalized === "territory-coverage-engine") {
    return "territory-coverage-engine";
  }
  if (normalized === "attainment-variance-feed") {
    return "attainment-variance-feed";
  }
  return null;
}

export function createDefaultPipelineOracleToolAdapters(): PipelineOracleToolAdapters {
  return {
    async fetchAttainmentVariance(
      input: QuotaToolInput
    ): Promise<AttainmentVarianceSnapshot> {
      QuotaToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.targetQuotaAttainmentPct}:attainment`;
      const projected = Number(deterministic(`${seed}:projected`, 71, 126).toFixed(2));
      return AttainmentVarianceSnapshotSchema.parse({
        projectedAttainmentPct: projected,
        topVarianceDriver:
          deterministic(`${seed}:driver`, 0, 1) > 0.5
            ? "quota loading mismatch across high-potential territories"
            : "ramp underperformance in newly hired enterprise reps",
        varianceToPlanPct: Number((projected - input.targetQuotaAttainmentPct).toFixed(2))
      });
    },

    async fetchCapacityPlanner(input: QuotaToolInput): Promise<CapacityPlannerSnapshot> {
      QuotaToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.startDate}:${input.endDate}:capacity`;
      return CapacityPlannerSnapshotSchema.parse({
        availableSellingCapacityPct: Number(
          deterministic(`${seed}:capacity`, 34, 89).toFixed(2)
        ),
        hiringReadinessPct: Number(deterministic(`${seed}:hiring`, 29, 95).toFixed(2)),
        rampRiskPct: Number(deterministic(`${seed}:ramp`, 7, 47).toFixed(2))
      });
    },

    async fetchTerritoryCoverage(
      input: QuotaToolInput
    ): Promise<TerritoryCoverageSnapshot> {
      QuotaToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.segments.join(",")}:coverage`;
      return TerritoryCoverageSnapshotSchema.parse({
        coverageBalanceIndex: Number(deterministic(`${seed}:balance`, 31, 92).toFixed(2)),
        overloadedTerritoriesPct: Number(
          deterministic(`${seed}:overloaded`, 5, 42).toFixed(2)
        ),
        whitespacePressurePct: Number(
          deterministic(`${seed}:whitespace`, 12, 56).toFixed(2)
        )
      });
    }
  };
}
