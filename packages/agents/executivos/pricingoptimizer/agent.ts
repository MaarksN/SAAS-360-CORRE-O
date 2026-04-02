// [SOURCE] BirthHub360_Agentes_Parallel_Plan - PricingOptimizer
import { access, readFile } from "node:fs/promises";
import path from "node:path";

import {
  type CompetitorEvent,
  type CompetitorFailureMode,
  type CompetitorMetrics,
  type PricingOptimizerContract,
  PricingOptimizerContractSchema,
  type PricingOptimizerInput,
  PricingOptimizerInputSchema,
  type PricingOptimizerOutput,
  PricingOptimizerOutputSchema,
  DEFAULT_COMPETITORXRAY_CONTRACT
} from "./schemas.js";
import {
  COMPETITORXRAY_TOOL_IDS,
  CompetitorIntelSnapshotSchema,
  createDefaultPricingOptimizerToolAdapters,
  FeatureGapSnapshotSchema,
  normalizeCompetitorToolId,
  PricingBenchmarkSnapshotSchema,
  type CompetitorToolId,
  type CompetitorToolInput,
  type PricingOptimizerToolAdapters
} from "./tools.js";

const DEFAULT_AUDIT_CONTRACT_PATH = path.resolve(
  process.cwd(),
  "audit",
  "pending_review",
  "ciclo1_pricingoptimizer",
  "contract.yaml"
);
const DEFAULT_AUDIT_CONTRACT_PATH_FROM_PACKAGE = path.resolve(
  process.cwd(),
  "..",
  "..",
  "audit",
  "pending_review",
  "ciclo1_pricingoptimizer",
  "contract.yaml"
);
const DEFAULT_PACKAGE_CONTRACT_PATH = path.resolve(
  process.cwd(),
  "packages",
  "agents",
  "executives",
  "PricingOptimizer",
  "contract.yaml"
);
const DEFAULT_PACKAGE_CONTRACT_PATH_FROM_PACKAGE = path.resolve(
  process.cwd(),
  "executives",
  "PricingOptimizer",
  "contract.yaml"
);
const DEFAULT_CONTRACT_PATHS = [
  DEFAULT_AUDIT_CONTRACT_PATH,
  DEFAULT_AUDIT_CONTRACT_PATH_FROM_PACKAGE,
  DEFAULT_PACKAGE_CONTRACT_PATH,
  DEFAULT_PACKAGE_CONTRACT_PATH_FROM_PACKAGE
] as const;

interface PricingOptimizerAgentOptions {
  contractPath?: string;
  now?: () => Date;
  sleep?: (delayMs: number) => Promise<void>;
  toolAdapters?: PricingOptimizerToolAdapters;
}

interface LoadedContract {
  contract: PricingOptimizerContract;
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

function toFailureMode(rawValue: string | undefined): CompetitorFailureMode | undefined {
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
    return DEFAULT_COMPETITORXRAY_CONTRACT.retry.maxAttempts;
  }
  return Math.min(3, Math.max(1, Math.trunc(value)));
}

function classifyContractSource(contractPath: string): LoadedContract["source"] {
  const normalized = path.normalize(contractPath).toLowerCase();
  if (
    normalized.endsWith(
      path
        .join("audit", "pending_review", "ciclo1_pricingoptimizer", "contract.yaml")
        .toLowerCase()
    )
  ) {
    return "audit_file";
  }
  if (
    normalized.endsWith(path.join("executives", "PricingOptimizer", "contract.yaml").toLowerCase())
  ) {
    return "file";
  }
  return "custom_file";
}

function parseContractOverridesFromObject(
  value: Record<string, unknown>
): Partial<PricingOptimizerContract> {
  const overrides: Partial<PricingOptimizerContract> = {};

  const toolIds =
    toStringArray(value.toolIds) ??
    toStringArray(value.tools) ??
    toStringArray(value.required_tools);
  if (toolIds) {
    overrides.toolIds = toolIds;
  }

  const retry = toRecord(value.retry);
  if (retry) {
    const retryOverride: Partial<PricingOptimizerContract["retry"]> = {};
    if (typeof retry.maxAttempts === "number") {
      retryOverride.maxAttempts = clampMaxAttempts(retry.maxAttempts);
    }
    if (typeof retry.baseDelayMs === "number") {
      retryOverride.baseDelayMs = retry.baseDelayMs;
    }
    if (Object.keys(retryOverride).length > 0) {
      overrides.retry = retryOverride as PricingOptimizerContract["retry"];
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
    const retryOverride: Partial<PricingOptimizerContract["retry"]> = {};

    if (toolUnavailable && typeof toolUnavailable.retry_attempts === "number") {
      retryOverride.maxAttempts = clampMaxAttempts(toolUnavailable.retry_attempts);
    }
    if (toolUnavailable && typeof toolUnavailable.base_delay_ms === "number") {
      retryOverride.baseDelayMs = toolUnavailable.base_delay_ms;
    }
    if (Object.keys(retryOverride).length > 0) {
      overrides.retry = {
        ...DEFAULT_COMPETITORXRAY_CONTRACT.retry,
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
        (entry): entry is PricingOptimizerContract["observability"]["events"][number] =>
          DEFAULT_COMPETITORXRAY_CONTRACT.observability.events.includes(
            entry as PricingOptimizerContract["observability"]["events"][number]
          )
      );
      const filteredMetrics = metrics?.filter(
        (entry): entry is PricingOptimizerContract["observability"]["metrics"][number] =>
          DEFAULT_COMPETITORXRAY_CONTRACT.observability.metrics.includes(
            entry as PricingOptimizerContract["observability"]["metrics"][number]
          )
      );
      overrides.observability = {
        events:
          filteredEvents && filteredEvents.length > 0
            ? filteredEvents
            : DEFAULT_COMPETITORXRAY_CONTRACT.observability.events,
        metrics:
          filteredMetrics && filteredMetrics.length > 0
            ? filteredMetrics
            : DEFAULT_COMPETITORXRAY_CONTRACT.observability.metrics
      };
    }
  }

  return overrides;
}

function parseContractOverrides(rawText: string): Partial<PricingOptimizerContract> {
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

  const overrides: Partial<PricingOptimizerContract> = {};
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
      ...DEFAULT_COMPETITORXRAY_CONTRACT.retry,
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
      (entry): entry is PricingOptimizerContract["observability"]["events"][number] =>
        DEFAULT_COMPETITORXRAY_CONTRACT.observability.events.includes(
          entry as PricingOptimizerContract["observability"]["events"][number]
        )
    );
    const filteredMetrics = metrics?.filter(
      (entry): entry is PricingOptimizerContract["observability"]["metrics"][number] =>
        DEFAULT_COMPETITORXRAY_CONTRACT.observability.metrics.includes(
          entry as PricingOptimizerContract["observability"]["metrics"][number]
        )
    );
    overrides.observability = {
      events:
        filteredEvents && filteredEvents.length > 0
          ? filteredEvents
          : DEFAULT_COMPETITORXRAY_CONTRACT.observability.events,
      metrics:
        filteredMetrics && filteredMetrics.length > 0
          ? filteredMetrics
          : DEFAULT_COMPETITORXRAY_CONTRACT.observability.metrics
    };
  }

  return overrides;
}

function mergeContract(
  overrides: Partial<PricingOptimizerContract>,
  fallback: PricingOptimizerContract
): PricingOptimizerContract {
  return PricingOptimizerContractSchema.parse({
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

export class PricingOptimizerAgent {
  private readonly contractPaths: string[];

  private readonly now: () => Date;

  private readonly sleepFn: (delayMs: number) => Promise<void>;

  private readonly toolAdapters: PricingOptimizerToolAdapters;

  private lastMetrics: CompetitorMetrics = {
    durationMs: 0,
    retries: 0,
    toolCalls: 0,
    toolFailures: 0
  };

  constructor(options: PricingOptimizerAgentOptions = {}) {
    this.contractPaths = options.contractPath
      ? [options.contractPath]
      : [...DEFAULT_CONTRACT_PATHS];
    this.now = options.now ?? (() => new Date());
    this.sleepFn = options.sleep ?? sleep;
    this.toolAdapters = options.toolAdapters ?? createDefaultPricingOptimizerToolAdapters();
  }

  getMetricsSnapshot(): CompetitorMetrics {
    return {
      ...this.lastMetrics
    };
  }

  async run(input: PricingOptimizerInput): Promise<PricingOptimizerOutput> {
    const parsedInput = PricingOptimizerInputSchema.parse(input);
    const startedAt = this.now();
    const events: CompetitorEvent[] = [];
    const metrics: CompetitorMetrics = {
      durationMs: 0,
      retries: 0,
      toolCalls: 0,
      toolFailures: 0
    };
    const fallbackReasons: string[] = [];

    const emitEvent = (
      event: Omit<CompetitorEvent, "timestamp"> & { timestamp?: string }
    ): void => {
      const normalized: CompetitorEvent = {
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
        toolId: "pricingoptimizer"
      },
      level: "info",
      message: "PricingOptimizer request accepted.",
      name: "pricingoptimizer.request.received"
    });

    const loadedContract = await this.loadContract();
    emitEvent({
      details: {
        source: loadedContract.source
      },
      level: "info",
      message: `Contract loaded from ${loadedContract.source}.`,
      name: "pricingoptimizer.contract.loaded"
    });

    const mappedTools = this.resolveToolIds(loadedContract.contract.toolIds);
    const effectiveTools =
      mappedTools.length > 0 ? mappedTools : [...COMPETITORXRAY_TOOL_IDS];

    const runWithRetry = async <T>(
      toolId: CompetitorToolId,
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
          name: "pricingoptimizer.tool.call.started"
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
            name: "pricingoptimizer.tool.call.succeeded"
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
            name: "pricingoptimizer.tool.call.failed"
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
            name: "pricingoptimizer.retry.scheduled"
          });
          await this.sleepFn(delay);
        }
      }

      metrics.toolFailures += 1;
      throw lastError ?? new Error(`${toolId} failed with no details.`);
    };

    const toolInput: CompetitorToolInput = {
      endDate: parsedInput.window.endDate,
      segments: parsedInput.segments,
      startDate: parsedInput.window.startDate,
      targetWinRateLiftPct: parsedInput.targetWinRateLiftPct,
      tenantId: parsedInput.tenantId
    };

    let competitorIntel = null;
    let pricingBenchmark = null;
    let featureGap = null;

    if (effectiveTools.includes("competitor-intel-feed")) {
      try {
        competitorIntel = CompetitorIntelSnapshotSchema.parse(
          await runWithRetry("competitor-intel-feed", () =>
            this.toolAdapters.fetchCompetitorIntel(toolInput)
          )
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "competitor-intel-feed failed.";
        fallbackReasons.push(`competitor-intel-feed: ${message}`);
      }
    }

    if (effectiveTools.includes("pricing-benchmark-engine")) {
      try {
        pricingBenchmark = PricingBenchmarkSnapshotSchema.parse(
          await runWithRetry("pricing-benchmark-engine", () =>
            this.toolAdapters.fetchPricingBenchmark(toolInput)
          )
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "pricing-benchmark-engine failed.";
        fallbackReasons.push(`pricing-benchmark-engine: ${message}`);
      }
    }

    if (effectiveTools.includes("feature-gap-analyzer")) {
      try {
        featureGap = FeatureGapSnapshotSchema.parse(
          await runWithRetry("feature-gap-analyzer", () =>
            this.toolAdapters.fetchFeatureGap(toolInput)
          )
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "feature-gap-analyzer failed.";
        fallbackReasons.push(`feature-gap-analyzer: ${message}`);
      }
    }

    const fallbackApplied = fallbackReasons.length > 0;
    const fallbackMode: CompetitorFailureMode | null = fallbackApplied
      ? loadedContract.contract.failureMode
      : null;

    if (fallbackApplied) {
      emitEvent({
        details: {
          fallbackMode: fallbackMode ?? undefined,
          source: "failure_behavior"
        },
        level: "warning",
        message: "Fallback behavior applied for PricingOptimizer output.",
        name: "pricingoptimizer.fallback.applied"
      });
    }

    const safeIntel = competitorIntel ?? {
      aggressiveMover: "competitor signal unavailable",
      displacementPressurePct: 0,
      strategicThreatIndex: 0
    };
    const safePricing = pricingBenchmark ?? {
      discountGapPct: 0,
      premiumJustificationScore: 0,
      priceElasticityRiskPct: 0
    };
    const safeFeature = featureGap ?? {
      differentiationScore: 0,
      highestGapTheme: "feature gap unavailable",
      parityCoveragePct: 0
    };

    const projectedWinRateLiftPct = Number(
      (
        safeFeature.differentiationScore * 0.3 +
        safePricing.premiumJustificationScore * 0.25 +
        (100 - safeIntel.displacementPressurePct) * 0.2 +
        safeFeature.parityCoveragePct * 0.15 -
        safePricing.priceElasticityRiskPct * 0.1
      ).toFixed(2)
    );

    const recommendedBattlefront =
      safeFeature.differentiationScore >= safePricing.premiumJustificationScore
        ? safeFeature.highestGapTheme
        : safeIntel.aggressiveMover;

    const status: PricingOptimizerOutput["status"] =
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
      message: "PricingOptimizer response generated.",
      name: "pricingoptimizer.response.generated"
    });

    const output = PricingOptimizerOutputSchema.parse({
      agent: "PricingOptimizer",
      competitorBrief: {
        actions: [
          {
            owner: "Sales Leadership",
            priority: toPriority(safeIntel.strategicThreatIndex + safeIntel.displacementPressurePct),
            recommendation:
              "Refresh battlecards weekly for top threat accounts with direct displacement proof points.",
            targetDate: addDays(parsedInput.window.endDate, 4)
          },
          {
            owner: "Product Marketing",
            priority: toPriority(100 - safeFeature.differentiationScore + safeFeature.parityCoveragePct),
            recommendation:
              "Package differentiated capabilities into scenario-based narratives by segment and competitor.",
            targetDate: addDays(parsedInput.window.endDate, 8)
          },
          {
            owner: "Pricing Committee",
            priority: toPriority(safePricing.priceElasticityRiskPct + Math.abs(safePricing.discountGapPct)),
            recommendation:
              "Limit discount exceptions with ROI guardrails and competitor-specific concession playbooks.",
            targetDate: addDays(parsedInput.window.endDate, 11)
          }
        ].slice(0, parsedInput.constraints.maxActions),
        headline: `Projected win-rate lift ${projectedWinRateLiftPct.toFixed(
          2
        )}% vs target ${parsedInput.targetWinRateLiftPct.toFixed(2)}%.`,
        projectedWinRateLiftPct,
        recommendedBattlefront,
        riskSignals: [
          {
            mitigation:
              "Escalate high-threat competitor motions to weekly GTM war-room with tracked counter-actions.",
            severity: toPriority(safeIntel.strategicThreatIndex + safeIntel.displacementPressurePct),
            signal: safeIntel.aggressiveMover
          },
          {
            mitigation:
              "Prioritize feature-proof and pricing-value messaging where elasticity risk exceeds threshold.",
            severity: toPriority(safePricing.priceElasticityRiskPct + (100 - safeFeature.differentiationScore)),
            signal: safeFeature.highestGapTheme
          }
        ],
        signals: [
          {
            confidence: toConfidence(100 - safeIntel.strategicThreatIndex),
            interpretation:
              "Strategic threat index estimates displacement probability in active pipeline segments.",
            metric: "Strategic Threat Index",
            value: safeIntel.strategicThreatIndex
          },
          {
            confidence: toConfidence(safeFeature.differentiationScore),
            interpretation:
              "Differentiation score measures how strongly our offer is perceived against top competitors.",
            metric: "Differentiation Score",
            value: safeFeature.differentiationScore
          },
          {
            confidence: toConfidence(100 - safePricing.priceElasticityRiskPct),
            interpretation:
              "Price elasticity risk captures likelihood of losing deals due to pricing sensitivity.",
            metric: "Price Elasticity Risk %",
            value: safePricing.priceElasticityRiskPct
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
        ? "PricingOptimizer generated under fallback mode due to tool failures."
        : "PricingOptimizer generated with complete competitor, pricing, and feature-gap signal coverage."
    });

    this.lastMetrics = {
      ...output.observability.metrics
    };
    return output;
  }

  private resolveToolIds(toolIds: string[]): CompetitorToolId[] {
    const mapped = toolIds
      .map((toolId) => normalizeCompetitorToolId(toolId))
      .filter((toolId): toolId is CompetitorToolId => toolId !== null);
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
          DEFAULT_COMPETITORXRAY_CONTRACT
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
      contract: DEFAULT_COMPETITORXRAY_CONTRACT,
      source: "default"
    };
  }
}
