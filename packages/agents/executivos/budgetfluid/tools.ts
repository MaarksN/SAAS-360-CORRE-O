// [SOURCE] BirthHub360_Agentes_Parallel_Plan - BudgetFluid
import { createHash } from "node:crypto";

import { z } from "zod";

import { BudgetSegmentSchema } from "./schemas.js";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format.");

export const BUDGETFLUID_TOOL_IDS = [
  "spend-telemetry-feed",
  "forecast-drift-engine",
  "scenario-stress-feed"
] as const;
export type BudgetToolId = (typeof BUDGETFLUID_TOOL_IDS)[number];

export const BudgetToolInputSchema = z
  .object({
    endDate: isoDateSchema,
    segments: z.array(BudgetSegmentSchema).min(1),
    startDate: isoDateSchema,
    targetBudgetEfficiencyPct: z.number().min(1).max(100),
    tenantId: z.string().trim().min(1)
  })
  .strict();
export type BudgetToolInput = z.infer<typeof BudgetToolInputSchema>;

export const SpendTelemetrySnapshotSchema = z
  .object({
    burnRatePct: z.number().min(0).max(300),
    efficiencyScorePct: z.number().min(0).max(100),
    overspendRiskPct: z.number().min(0).max(100)
  })
  .strict();
export type SpendTelemetrySnapshot = z.infer<typeof SpendTelemetrySnapshotSchema>;

export const ForecastDriftSnapshotSchema = z
  .object({
    cashRunwayDeltaMonths: z.number().min(-24).max(24),
    topDriftDriver: z.string().min(1),
    varianceToPlanPct: z.number().min(-100).max(100)
  })
  .strict();
export type ForecastDriftSnapshot = z.infer<typeof ForecastDriftSnapshotSchema>;

export const ScenarioStressSnapshotSchema = z
  .object({
    downsideRiskPct: z.number().min(0).max(100),
    upsideLeveragePct: z.number().min(0).max(100),
    volatilityIndex: z.number().min(0).max(100)
  })
  .strict();
export type ScenarioStressSnapshot = z.infer<typeof ScenarioStressSnapshotSchema>;

export interface BudgetFluidToolAdapters {
  fetchForecastDrift(input: BudgetToolInput): Promise<ForecastDriftSnapshot>;
  fetchScenarioStress(input: BudgetToolInput): Promise<ScenarioStressSnapshot>;
  fetchSpendTelemetry(input: BudgetToolInput): Promise<SpendTelemetrySnapshot>;
}

function deterministic(seed: string, min: number, max: number): number {
  const digest = createHash("sha256").update(seed).digest("hex");
  const parsed = Number.parseInt(digest.slice(0, 10), 16);
  const ratio = parsed / Number.parseInt("ffffffffff", 16);
  return min + (max - min) * ratio;
}

export function normalizeBudgetToolId(toolId: string): BudgetToolId | null {
  const normalized = toolId
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (normalized === "spend-telemetry-feed") {
    return "spend-telemetry-feed";
  }
  if (normalized === "forecast-drift-engine") {
    return "forecast-drift-engine";
  }
  if (normalized === "scenario-stress-feed") {
    return "scenario-stress-feed";
  }
  return null;
}

export function createDefaultBudgetFluidToolAdapters(): BudgetFluidToolAdapters {
  return {
    async fetchForecastDrift(input: BudgetToolInput): Promise<ForecastDriftSnapshot> {
      BudgetToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.startDate}:${input.endDate}:drift`;
      return ForecastDriftSnapshotSchema.parse({
        cashRunwayDeltaMonths: Number(deterministic(`${seed}:runway`, -4, 7).toFixed(2)),
        topDriftDriver:
          deterministic(`${seed}:driver`, 0, 1) > 0.5
            ? "campaign commitments exceeding planned conversion capacity"
            : "hiring ramp and vendor renewals ahead of budget cadence",
        varianceToPlanPct: Number(deterministic(`${seed}:variance`, -22, 28).toFixed(2))
      });
    },

    async fetchScenarioStress(input: BudgetToolInput): Promise<ScenarioStressSnapshot> {
      BudgetToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.targetBudgetEfficiencyPct}:stress`;
      return ScenarioStressSnapshotSchema.parse({
        downsideRiskPct: Number(deterministic(`${seed}:downside`, 9, 63).toFixed(2)),
        upsideLeveragePct: Number(deterministic(`${seed}:upside`, 14, 72).toFixed(2)),
        volatilityIndex: Number(deterministic(`${seed}:volatility`, 11, 79).toFixed(2))
      });
    },

    async fetchSpendTelemetry(input: BudgetToolInput): Promise<SpendTelemetrySnapshot> {
      BudgetToolInputSchema.parse(input);
      const seed = `${input.tenantId}:${input.segments.join(",")}:telemetry`;
      return SpendTelemetrySnapshotSchema.parse({
        burnRatePct: Number(deterministic(`${seed}:burn`, 67, 149).toFixed(2)),
        efficiencyScorePct: Number(deterministic(`${seed}:efficiency`, 39, 91).toFixed(2)),
        overspendRiskPct: Number(deterministic(`${seed}:overspend`, 8, 58).toFixed(2))
      });
    }
  };
}
