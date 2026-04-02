// [SOURCE] BirthHub360_Agentes_Parallel_Plan - BudgetFluid
import { access, readFile } from "node:fs/promises";
import path from "node:path";

import {
  type BudgetEvent,
  type BudgetFailureMode,
  type BudgetFluidContract,
  BudgetFluidContractSchema,
  type BudgetFluidInput,
  BudgetFluidInputSchema,
  type BudgetFluidOutput,
  BudgetFluidOutputSchema,
  type BudgetMetrics,
  DEFAULT_BUDGETFLUID_CONTRACT
} from "./schemas.js";
import {
  BUDGETFLUID_TOOL_IDS,
  type BudgetFluidToolAdapters,
  type BudgetToolId,
  type BudgetToolInput,
  createDefaultBudgetFluidToolAdapters,
  ForecastDriftSnapshotSchema,
  normalizeBudgetToolId,
  ScenarioStressSnapshotSchema,
  SpendTelemetrySnapshotSchema
} from "./tools.js";

const DEFAULT_AUDIT_CONTRACT_PATH = path.resolve(
  process.cwd(),
  "audit",
  "pending_review",
  "ciclo1_budgetfluid",
  "contract.yaml"
);
const DEFAULT_AUDIT_CONTRACT_PATH_FROM_PACKAGE = path.resolve(
  process.cwd(),
  "..",
  "..",
  "audit",
  "pending_review",
  "ciclo1_budgetfluid",
  "contract.yaml"
);
const DEFAULT_PACKAGE_CONTRACT_PATH = path.resolve(
  process.cwd(),
  "packages",
  "agents",
  "executives",
  "BudgetFluid",
  "contract.yaml"
);
const DEFAULT_PACKAGE_CONTRACT_PATH_FROM_PACKAGE = path.resolve(
  process.cwd(),
  "executives",
  "BudgetFluid",
  "contract.yaml"
);
const DEFAULT_CONTRACT_PATHS = [
  DEFAULT_AUDIT_CONTRACT_PATH,
  DEFAULT_AUDIT_CONTRACT_PATH_FROM_PACKAGE,
  DEFAULT_PACKAGE_CONTRACT_PATH,
  DEFAULT_PACKAGE_CONTRACT_PATH_FROM_PACKAGE
] as const;

interface BudgetFluidAgentOptions {
  contractPath?: string;
  now?: () => Date;
  sleep?: (delayMs: number) => Promise<void>;
  toolAdapters?: BudgetFluidToolAdapters;
}

interface LoadedContract {
  contract: BudgetFluidContract;
  source: "audit_file" | "custom_file" | "default" | "file" | "package_file";
}

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value.filter(
    (entry): entry is string => typeof entry === "string" && entry.trim().length > 0
  );
  return items.length > 0 ? items : undefined;
}

function toFailureMode(rawValue: string | undefined): BudgetFailureMode | undefined {
  if (!rawValue) {
    return undefined;
  }
  const normalized = rawValue.trim().toLowerCase();
  if (normalized.includes("degrad")) {
    return "degraded_report";
  }
  if (normalized.includes("human")) {
    return "human_handoff";
  }
  if (normalized.includes("hard") || normalized.includes("fail")) {
    return "hard_fail";
  }
  return undefined;
}

function extractYamlArray(text: string, acceptedKeys: string[]): string[] | undefined {
  const lines = text.split(/\r?\n/);
  const normalizedKeys = new Set(acceptedKeys.map((entry) => entry.toLowerCase()));
  const items: string[] = [];
  let collecting = false;
  let collectorIndent = 0;

  for (const line of lines) {
    const keyMatch = line.match(/^(\s*)([A-Za-z0-9_-]+)\s*:\s*$/);
    if (keyMatch) {
      const key = keyMatch[2]?.toLowerCase();
      if (key && normalizedKeys.has(key)) {
        collecting = true;
        collectorIndent = keyMatch[1]?.length ?? 0;
        continue;
      }
      collecting = false;
    }

    if (!collecting) {
      continue;
    }

    const lineIndent = line.match(/^(\s*)/)?.[1]?.length ?? 0;
    const itemMatch = line.match(/^\s*-\s*(.+)\s*$/);
    if (!itemMatch && line.trim().length > 0 && lineIndent <= collectorIndent) {
      collecting = false;
      continue;
    }
    if (!itemMatch) {
      continue;
    }

    const cleaned = (itemMatch[1] ?? "")
      .trim()
      .replace(/^['"]/, "")
      .replace(/['"]$/, "");
    if (cleaned.length > 0) {
      items.push(cleaned);
    }
  }

  return items.length > 0 ? items : undefined;
}

function extractFirstNumber(text: string, patterns: RegExp[]): number | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) {
      continue;
    }
    const parsed = Number.parseInt(match[1], 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function clampMaxAttempts(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_BUDGETFLUID_CONTRACT.retry.maxAttempts;
  }
  return Math.min(3, Math.max(1, Math.trunc(value)));
}

function classifyContractSource(contractPath: string): LoadedContract["source"] {
  const normalized = path.normalize(contractPath).toLowerCase();
  if (
    normalized.endsWith(
      path
        .join("audit", "pending_review", "ciclo1_budgetfluid", "contract.yaml")
        .toLowerCase()
    )
  ) {
    return "audit_file";
  }
  if (
    normalized.endsWith(path.join("executives", "BudgetFluid", "contract.yaml").toLowerCase())
  ) {
    return "file";
  }
  return "custom_file";
}

function parseContractOverridesFromObject(
  value: Record<string, unknown>
): Partial<BudgetFluidContract> {
  const overrides: Partial<BudgetFluidContract> = {};

  const toolIds =
    toStringArray(value.toolIds) ??
    toStringArray(value.tools) ??
    toStringArray(value.required_tools);
  if (toolIds) {
    overrides.toolIds = toolIds;
  }

  const retry = toRecord(value.retry);
  if (retry) {
    const retryOverride: Partial<BudgetFluidContract["retry"]> = {};
    if (typeof retry.maxAttempts === "number") {
      retryOverride.maxAttempts = clampMaxAttempts(retry.maxAttempts);
    }
    if (typeof retry.baseDelayMs === "number") {
      retryOverride.baseDelayMs = retry.baseDelayMs;
    }
    if (Object.keys(retryOverride).length > 0) {
      overrides.retry = retryOverride as BudgetFluidContract["retry"];
    }
  }

  if (typeof value.failureMode === "string") {
    const mode = toFailureMode(value.failureMode);
    if (mode) {
      overrides.failureMode = mode;
    }
  }

  const fallbackBehavior = toRecord(value.fallback_behavior);
  if (fallbackBehavior) {
    const toolUnavailable = toRecord(fallbackBehavior.tool_unavailable);
    const exhausted = toRecord(fallbackBehavior.exhausted);
    const retryOverride: Partial<BudgetFluidContract["retry"]> = {};

    if (toolUnavailable && typeof toolUnavailable.retry_attempts === "number") {
      retryOverride.maxAttempts = clampMaxAttempts(toolUnavailable.retry_attempts);
    }
    if (toolUnavailable && typeof toolUnavailable.base_delay_ms === "number") {
      retryOverride.baseDelayMs = toolUnavailable.base_delay_ms;
    }
    if (Object.keys(retryOverride).length > 0) {
      overrides.retry = {
        ...DEFAULT_BUDGETFLUID_CONTRACT.retry,
        ...retryOverride
      };
    }
    if (exhausted && exhausted.notify_human === true) {
      overrides.failureMode = "human_handoff";
    }
  }

  if (typeof value.failure_behavior === "string") {
    const mode = toFailureMode(value.failure_behavior);
    if (mode) {
      overrides.failureMode = mode;
    }
  }
  if (typeof value.fallback === "string") {
    const mode = toFailureMode(value.fallback);
    if (mode) {
      overrides.failureMode = mode;
    }
  }

  const observability = toRecord(value.observability);
  if (observability) {
    const events =
      toStringArray(observability.events_to_log) ??
      toStringArray(observability.events);
    const metrics = toStringArray(observability.metrics);
    if (events || metrics) {
      const filteredEvents = events?.filter(
        (entry): entry is BudgetFluidContract["observability"]["events"][number] =>
          DEFAULT_BUDGETFLUID_CONTRACT.observability.events.includes(
            entry as BudgetFluidContract["observability"]["events"][number]
          )
      );
      const filteredMetrics = metrics?.filter(
        (entry): entry is BudgetFluidContract["observability"]["metrics"][number] =>
          DEFAULT_BUDGETFLUID_CONTRACT.observability.metrics.includes(
            entry as BudgetFluidContract["observability"]["metrics"][number]
          )
      );
      overrides.observability = {
        events:
          filteredEvents && filteredEvents.length > 0
            ? filteredEvents
            : DEFAULT_BUDGETFLUID_CONTRACT.observability.events,
        metrics:
          filteredMetrics && filteredMetrics.length > 0
            ? filteredMetrics
            : DEFAULT_BUDGETFLUID_CONTRACT.observability.metrics
      };
    }
  }

  return overrides;
}

function parseContractOverrides(rawText: string): Partial<BudgetFluidContract> {
  const trimmed = rawText.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      const asRecord = toRecord(parsed);
      if (asRecord) {
        return parseContractOverridesFromObject(asRecord);
      }
    } catch {
      // keep fallback parsing
    }
  }

  const overrides: Partial<BudgetFluidContract> = {};
  const maxAttempts = extractFirstNumber(rawText, [
    /retry_attempts\s*:\s*(\d+)/i,
    /maxAttempts\s*:\s*(\d+)/i,
    /max_attempts\s*:\s*(\d+)/i,
    /attempts\s*:\s*(\d+)/i
  ]);
  const baseDelayMs = extractFirstNumber(rawText, [
    /base_delay_ms\s*:\s*(\d+)/i,
    /baseDelayMs\s*:\s*(\d+)/i,
    /backoff_ms\s*:\s*(\d+)/i,
    /wait_ms\s*:\s*(\d+)/i
  ]);

  if (maxAttempts !== undefined || baseDelayMs !== undefined) {
    overrides.retry = {
      ...DEFAULT_BUDGETFLUID_CONTRACT.retry,
      ...(maxAttempts !== undefined
        ? { maxAttempts: clampMaxAttempts(maxAttempts) }
        : {}),
      ...(baseDelayMs !== undefined ? { baseDelayMs } : {})
    };
  }

  const modeMatch = rawText.match(
    /(?:failureMode|failure_mode|fallback_mode|failure_behavior|fallback|mode)\s*:\s*["']?([a-zA-Z_-]+)["']?/i
  );
  if (modeMatch?.[1]) {
    const mapped = toFailureMode(modeMatch[1]);
    if (mapped) {
      overrides.failureMode = mapped;
    }
  }
  if (/notify_human\s*:\s*true/i.test(rawText)) {
    overrides.failureMode = "human_handoff";
  }

  const toolIds =
    extractYamlArray(rawText, ["toolIds", "tools", "required_tools"]) ??
    (() => {
      const inline = rawText.match(
        /(?:toolIds|tools|required_tools)\s*:\s*\[([^\]]+)\]/i
      );
      if (!inline?.[1]) {
        return undefined;
      }
      const list = inline[1]
        .split(",")
        .map((entry) => entry.trim().replace(/^['"]/, "").replace(/['"]$/, ""))
        .filter((entry) => entry.length > 0);
      return list.length > 0 ? list : undefined;
    })();
  if (toolIds) {
    overrides.toolIds = toolIds;
  }

  const events = extractYamlArray(rawText, ["events_to_log", "events"]);
  const metrics = extractYamlArray(rawText, ["metrics"]);
  if (events || metrics) {
    const filteredEvents = events?.filter(
      (entry): entry is BudgetFluidContract["observability"]["events"][number] =>
        DEFAULT_BUDGETFLUID_CONTRACT.observability.events.includes(
          entry as BudgetFluidContract["observability"]["events"][number]
        )
    );
    const filteredMetrics = metrics?.filter(
      (entry): entry is BudgetFluidContract["observability"]["metrics"][number] =>
        DEFAULT_BUDGETFLUID_CONTRACT.observability.metrics.includes(
          entry as BudgetFluidContract["observability"]["metrics"][number]
        )
    );
    overrides.observability = {
      events:
        filteredEvents && filteredEvents.length > 0
          ? filteredEvents
          : DEFAULT_BUDGETFLUID_CONTRACT.observability.events,
      metrics:
        filteredMetrics && filteredMetrics.length > 0
          ? filteredMetrics
          : DEFAULT_BUDGETFLUID_CONTRACT.observability.metrics
    };
  }

  return overrides;
}

function mergeContract(
  overrides: Partial<BudgetFluidContract>,
  fallback: BudgetFluidContract
): BudgetFluidContract {
  return BudgetFluidContractSchema.parse({
    ...fallback,
    ...overrides,
    observability: {
      ...fallback.observability,
      ...overrides.observability
    },
    retry: {
      ...fallback.retry,
      ...overrides.retry
    },
    toolIds: overrides.toolIds ?? fallback.toolIds
  });
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function toPriority(score: number): "critical" | "high" | "low" | "medium" {
  if (score >= 80) {
    return "critical";
  }
  if (score >= 60) {
    return "high";
  }
  if (score >= 35) {
    return "medium";
  }
  return "low";
}

function toConfidence(score: number): "high" | "low" | "medium" {
  if (score >= 75) {
    return "high";
  }
  if (score >= 45) {
    return "medium";
  }
  return "low";
}

export class BudgetFluidAgent {
  private readonly contractPaths: string[];

  private readonly now: () => Date;

  private readonly sleepFn: (delayMs: number) => Promise<void>;

  private readonly toolAdapters: BudgetFluidToolAdapters;

  private lastMetrics: BudgetMetrics = {
    durationMs: 0,
    retries: 0,
    toolCalls: 0,
    toolFailures: 0
  };

  constructor(options: BudgetFluidAgentOptions = {}) {
    this.contractPaths = options.contractPath
      ? [options.contractPath]
      : [...DEFAULT_CONTRACT_PATHS];
    this.now = options.now ?? (() => new Date());
    this.sleepFn = options.sleep ?? sleep;
    this.toolAdapters = options.toolAdapters ?? createDefaultBudgetFluidToolAdapters();
  }

  getMetricsSnapshot(): BudgetMetrics {
    return {
      ...this.lastMetrics
    };
  }

  async run(input: BudgetFluidInput): Promise<BudgetFluidOutput> {
    const parsedInput = BudgetFluidInputSchema.parse(input);
    const startedAt = this.now();
    const events: BudgetEvent[] = [];
    const metrics: BudgetMetrics = {
      durationMs: 0,
      retries: 0,
      toolCalls: 0,
      toolFailures: 0
    };
    const fallbackReasons: string[] = [];

    const emitEvent = (
      event: Omit<BudgetEvent, "timestamp"> & { timestamp?: string }
    ): void => {
      const normalized: BudgetEvent = {
        ...event,
        timestamp: event.timestamp ?? this.now().toISOString()
      };
      events.push(normalized);
      const payload = JSON.stringify({
        level: normalized.level,
        message: normalized.message,
        name: normalized.name
      });
      if (normalized.level === "error") {
        console.error(payload);
      } else if (normalized.level === "warning") {
        console.warn(payload);
      } else {
        console.log(payload);
      }
    };

    emitEvent({
      details: {
        source: "request",
        toolId: "budgetfluid"
      },
      level: "info",
      message: "BudgetFluid request accepted.",
      name: "budgetfluid.request.received"
    });

    const loadedContract = await this.loadContract();
    emitEvent({
      details: {
        source: loadedContract.source
      },
      level: "info",
      message: `Contract loaded from ${loadedContract.source}.`,
      name: "budgetfluid.contract.loaded"
    });

    const mappedTools = this.resolveToolIds(loadedContract.contract.toolIds);
    const effectiveTools =
      mappedTools.length > 0 ? mappedTools : [...BUDGETFLUID_TOOL_IDS];

    const runWithRetry = async <T>(
      toolId: BudgetToolId,
      operation: () => Promise<T>
    ): Promise<T> => {
      const maxAttempts = loadedContract.contract.retry.maxAttempts;
      const baseDelayMs = loadedContract.contract.retry.baseDelayMs;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        emitEvent({
          details: {
            attempt,
            maxAttempts,
            toolId
          },
          level: "info",
          message: `Running ${toolId} (attempt ${attempt}/${maxAttempts}).`,
          name: "budgetfluid.tool.call.started"
        });

        try {
          metrics.toolCalls += 1;
          const result = await operation();
          emitEvent({
            details: {
              attempt,
              toolId
            },
            level: "info",
            message: `${toolId} completed.`,
            name: "budgetfluid.tool.call.succeeded"
          });
          return result;
        } catch (error) {
          const asError =
            error instanceof Error ? error : new Error("Unknown tool failure.");
          lastError = asError;
          emitEvent({
            details: {
              attempt,
              errorCode: asError.message,
              maxAttempts,
              toolId
            },
            level: "warning",
            message: `${toolId} failed at attempt ${attempt}.`,
            name: "budgetfluid.tool.call.failed"
          });
          if (attempt >= maxAttempts) {
            break;
          }
          metrics.retries += 1;
          const delay = baseDelayMs * 2 ** (attempt - 1);
          emitEvent({
            details: {
              attempt,
              maxAttempts,
              toolId
            },
            level: "info",
            message: `${toolId} retry scheduled after ${delay}ms.`,
            name: "budgetfluid.retry.scheduled"
          });
          await this.sleepFn(delay);
        }
      }

      metrics.toolFailures += 1;
      throw lastError ?? new Error(`${toolId} failed with no details.`);
    };

    const toolInput: BudgetToolInput = {
      endDate: parsedInput.window.endDate,
      segments: parsedInput.segments,
      startDate: parsedInput.window.startDate,
      targetBudgetEfficiencyPct: parsedInput.targetBudgetEfficiencyPct,
      tenantId: parsedInput.tenantId
    };

    let spendTelemetry = null;
    let forecastDrift = null;
    let scenarioStress = null;

    if (effectiveTools.includes("spend-telemetry-feed")) {
      try {
        spendTelemetry = SpendTelemetrySnapshotSchema.parse(
          await runWithRetry("spend-telemetry-feed", () =>
            this.toolAdapters.fetchSpendTelemetry(toolInput)
          )
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "spend-telemetry-feed failed.";
        fallbackReasons.push(`spend-telemetry-feed: ${message}`);
      }
    }

    if (effectiveTools.includes("forecast-drift-engine")) {
      try {
        forecastDrift = ForecastDriftSnapshotSchema.parse(
          await runWithRetry("forecast-drift-engine", () =>
            this.toolAdapters.fetchForecastDrift(toolInput)
          )
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "forecast-drift-engine failed.";
        fallbackReasons.push(`forecast-drift-engine: ${message}`);
      }
    }

    if (effectiveTools.includes("scenario-stress-feed")) {
      try {
        scenarioStress = ScenarioStressSnapshotSchema.parse(
          await runWithRetry("scenario-stress-feed", () =>
            this.toolAdapters.fetchScenarioStress(toolInput)
          )
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "scenario-stress-feed failed.";
        fallbackReasons.push(`scenario-stress-feed: ${message}`);
      }
    }

    const fallbackApplied = fallbackReasons.length > 0;
    const fallbackMode: BudgetFailureMode | null = fallbackApplied
      ? loadedContract.contract.failureMode
      : null;

    if (fallbackApplied) {
      emitEvent({
        details: {
          fallbackMode: fallbackMode ?? undefined,
          source: "failure_behavior"
        },
        level: "warning",
        message: "Fallback behavior applied for BudgetFluid output.",
        name: "budgetfluid.fallback.applied"
      });
    }

    const safeSpend = spendTelemetry ?? {
      burnRatePct: 0,
      efficiencyScorePct: 0,
      overspendRiskPct: 0
    };
    const safeDrift = forecastDrift ?? {
      cashRunwayDeltaMonths: 0,
      topDriftDriver: "drift signal unavailable",
      varianceToPlanPct: 0
    };
    const safeStress = scenarioStress ?? {
      downsideRiskPct: 0,
      upsideLeveragePct: 0,
      volatilityIndex: 0
    };

    const projectedEfficiencyPct = Number(
      (
        safeSpend.efficiencyScorePct * 0.45 +
        safeStress.upsideLeveragePct * 0.25 +
        (100 - safeSpend.overspendRiskPct) * 0.2 -
        Math.abs(safeDrift.varianceToPlanPct) * 0.15 -
        safeStress.volatilityIndex * 0.1
      ).toFixed(2)
    );

    const recommendedReallocationPct = Number(
      (
        safeSpend.overspendRiskPct * 0.35 +
        Math.abs(safeDrift.varianceToPlanPct) * 0.25 +
        safeStress.downsideRiskPct * 0.2 -
        safeStress.upsideLeveragePct * 0.15
      ).toFixed(2)
    );

    const status: BudgetFluidOutput["status"] =
      fallbackApplied && fallbackMode === "hard_fail"
        ? "error"
        : fallbackApplied
          ? "fallback"
          : "success";

    metrics.durationMs = Math.max(0, this.now().getTime() - startedAt.getTime());
    emitEvent({
      details: {
        source: "response"
      },
      level: status === "error" ? "error" : "info",
      message: "BudgetFluid response generated.",
      name: "budgetfluid.response.generated"
    });

    const output = BudgetFluidOutputSchema.parse({
      agent: "BudgetFluid",
      budgetBrief: {
        actions: [
          {
            owner: "CFO",
            priority: toPriority(safeSpend.overspendRiskPct + Math.abs(safeDrift.varianceToPlanPct)),
            recommendation:
              "Rebalance discretionary spend from low-efficiency lanes into proven revenue channels.",
            targetDate: addDays(parsedInput.window.endDate, 5)
          },
          {
            owner: "RevOps",
            priority: toPriority(safeStress.volatilityIndex + safeStress.downsideRiskPct),
            recommendation:
              "Apply monthly stress-test guardrails and freeze thresholds for high-volatility scenarios.",
            targetDate: addDays(parsedInput.window.endDate, 9)
          },
          {
            owner: "FP&A",
            priority: toPriority(100 - safeSpend.efficiencyScorePct + Math.abs(safeDrift.varianceToPlanPct)),
            recommendation:
              "Tighten rolling forecast cadence with weekly variance review on top budget hotspots.",
            targetDate: addDays(parsedInput.window.endDate, 12)
          }
        ].slice(0, parsedInput.constraints.maxActions),
        headline: `Projected efficiency ${projectedEfficiencyPct.toFixed(
          2
        )}% vs target ${parsedInput.targetBudgetEfficiencyPct.toFixed(2)}%.`,
        projectedEfficiencyPct,
        recommendedReallocationPct,
        riskSignals: [
          {
            mitigation:
              "Introduce pre-approval gates for spend categories with recurring overspend risk.",
            severity: toPriority(safeSpend.overspendRiskPct + safeStress.volatilityIndex),
            signal: safeDrift.topDriftDriver
          },
          {
            mitigation:
              "Increase scenario buffer for downside cases while preserving upside allocation options.",
            severity: toPriority(safeStress.downsideRiskPct + Math.abs(safeDrift.varianceToPlanPct)),
            signal: `Cash runway delta ${safeDrift.cashRunwayDeltaMonths.toFixed(2)} months.`
          }
        ],
        signals: [
          {
            confidence: toConfidence(safeSpend.efficiencyScorePct),
            interpretation: "Efficiency score reflects quality of spend-to-outcome conversion.",
            metric: "Efficiency Score %",
            value: safeSpend.efficiencyScorePct
          },
          {
            confidence: toConfidence(100 - Math.abs(safeDrift.varianceToPlanPct)),
            interpretation: "Forecast variance indicates drift risk against planned budget envelope.",
            metric: "Variance To Plan %",
            value: safeDrift.varianceToPlanPct
          },
          {
            confidence: toConfidence(100 - safeStress.volatilityIndex),
            interpretation: "Volatility index measures scenario stability under market and execution shocks.",
            metric: "Volatility Index",
            value: safeStress.volatilityIndex
          }
        ]
      },
      domain: "executivos",
      fallback: {
        applied: fallbackApplied,
        mode: fallbackMode,
        reasons: fallbackReasons
      },
      generatedAt: this.now().toISOString(),
      observability: {
        events,
        metrics
      },
      status,
      summary: fallbackApplied
        ? "BudgetFluid generated under fallback mode due to tool failures."
        : "BudgetFluid generated with complete budget telemetry and scenario coverage."
    });

    this.lastMetrics = {
      ...output.observability.metrics
    };
    return output;
  }

  private resolveToolIds(toolIds: string[]): BudgetToolId[] {
    const mapped = toolIds
      .map((toolId) => normalizeBudgetToolId(toolId))
      .filter((toolId): toolId is BudgetToolId => toolId !== null);
    return Array.from(new Set(mapped));
  }

  private async loadContract(): Promise<LoadedContract> {
    for (const contractPath of this.contractPaths) {
      try {
        await access(contractPath);
      } catch {
        continue;
      }

      try {
        const content = await readFile(contractPath, "utf8");
        const merged = mergeContract(
          parseContractOverrides(content),
          DEFAULT_BUDGETFLUID_CONTRACT
        );
        return {
          contract: merged,
          source: classifyContractSource(contractPath)
        };
      } catch {
        continue;
      }
    }

    return {
      contract: DEFAULT_BUDGETFLUID_CONTRACT,
      source: "default"
    };
  }
}
