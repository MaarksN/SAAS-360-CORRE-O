// [SOURCE] BirthHub360_Agentes_Parallel_Plan - ExpansionMapper
import { access, readFile } from "node:fs/promises";
import path from "node:path";

import {
  DEFAULT_TRENDCATCHER_CONTRACT,
  type ExpansionMapperContract,
  ExpansionMapperContractSchema,
  type ExpansionMapperInput,
  ExpansionMapperInputSchema,
  type ExpansionMapperOutput,
  ExpansionMapperOutputSchema,
  type MarketEvent,
  type TrendFailureMode,
  type MarketMetrics
} from "./schemas.js";
import {
  CategoryGrowthSnapshotSchema,
  createDefaultExpansionMapperToolAdapters,
  MarketTrendSnapshotSchema,
  normalizeTrendToolId,
  SocialSignalSnapshotSchema,
  TRENDCATCHER_TOOL_IDS,
  type ExpansionMapperToolAdapters,
  type TrendToolId,
  type TrendToolInput
} from "./tools.js";

const DEFAULT_AUDIT_CONTRACT_PATH = path.resolve(
  process.cwd(),
  "audit",
  "pending_review",
  "ciclo1_expansionmapper",
  "contract.yaml"
);
const DEFAULT_AUDIT_CONTRACT_PATH_FROM_PACKAGE = path.resolve(
  process.cwd(),
  "..",
  "..",
  "audit",
  "pending_review",
  "ciclo1_expansionmapper",
  "contract.yaml"
);
const DEFAULT_PACKAGE_CONTRACT_PATH = path.resolve(
  process.cwd(),
  "packages",
  "agents",
  "executives",
  "ExpansionMapper",
  "contract.yaml"
);
const DEFAULT_PACKAGE_CONTRACT_PATH_FROM_PACKAGE = path.resolve(
  process.cwd(),
  "executives",
  "ExpansionMapper",
  "contract.yaml"
);
const DEFAULT_CONTRACT_PATHS = [
  DEFAULT_AUDIT_CONTRACT_PATH,
  DEFAULT_AUDIT_CONTRACT_PATH_FROM_PACKAGE,
  DEFAULT_PACKAGE_CONTRACT_PATH,
  DEFAULT_PACKAGE_CONTRACT_PATH_FROM_PACKAGE
] as const;

interface ExpansionMapperAgentOptions {
  contractPath?: string;
  now?: () => Date;
  sleep?: (delayMs: number) => Promise<void>;
  toolAdapters?: ExpansionMapperToolAdapters;
}

interface LoadedContract {
  contract: ExpansionMapperContract;
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

function toFailureMode(rawValue: string | undefined): TrendFailureMode | undefined {
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
    return DEFAULT_TRENDCATCHER_CONTRACT.retry.maxAttempts;
  }
  return Math.min(3, Math.max(1, Math.trunc(value)));
}

function classifyContractSource(contractPath: string): LoadedContract["source"] {
  const normalized = path.normalize(contractPath).toLowerCase();
  if (
    normalized.endsWith(
      path
        .join("audit", "pending_review", "ciclo1_expansionmapper", "contract.yaml")
        .toLowerCase()
    )
  ) {
    return "audit_file";
  }
  if (
    normalized.endsWith(
      path.join("executives", "ExpansionMapper", "contract.yaml").toLowerCase()
    )
  ) {
    return "file";
  }
  return "custom_file";
}

function parseContractOverridesFromObject(
  value: Record<string, unknown>
): Partial<ExpansionMapperContract> {
  const overrides: Partial<ExpansionMapperContract> = {};

  const toolIds =
    toStringArray(value.toolIds) ??
    toStringArray(value.tools) ??
    toStringArray(value.required_tools);
  if (toolIds) {
    overrides.toolIds = toolIds;
  }

  const retry = toRecord(value.retry);
  if (retry) {
    const retryOverride: Partial<ExpansionMapperContract["retry"]> = {};
    if (typeof retry.maxAttempts === "number") {
      retryOverride.maxAttempts = clampMaxAttempts(retry.maxAttempts);
    }
    if (typeof retry.baseDelayMs === "number") {
      retryOverride.baseDelayMs = retry.baseDelayMs;
    }
    if (Object.keys(retryOverride).length > 0) {
      overrides.retry = retryOverride as ExpansionMapperContract["retry"];
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
    const retryOverride: Partial<ExpansionMapperContract["retry"]> = {};

    if (toolUnavailable && typeof toolUnavailable.retry_attempts === "number") {
      retryOverride.maxAttempts = clampMaxAttempts(toolUnavailable.retry_attempts);
    }
    if (toolUnavailable && typeof toolUnavailable.base_delay_ms === "number") {
      retryOverride.baseDelayMs = toolUnavailable.base_delay_ms;
    }
    if (Object.keys(retryOverride).length > 0) {
      overrides.retry = {
        ...DEFAULT_TRENDCATCHER_CONTRACT.retry,
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
        (entry): entry is ExpansionMapperContract["observability"]["events"][number] =>
          DEFAULT_TRENDCATCHER_CONTRACT.observability.events.includes(
            entry as ExpansionMapperContract["observability"]["events"][number]
          )
      );
      const filteredMetrics = metrics?.filter(
        (entry): entry is ExpansionMapperContract["observability"]["metrics"][number] =>
          DEFAULT_TRENDCATCHER_CONTRACT.observability.metrics.includes(
            entry as ExpansionMapperContract["observability"]["metrics"][number]
          )
      );
      overrides.observability = {
        events:
          filteredEvents && filteredEvents.length > 0
            ? filteredEvents
            : DEFAULT_TRENDCATCHER_CONTRACT.observability.events,
        metrics:
          filteredMetrics && filteredMetrics.length > 0
            ? filteredMetrics
            : DEFAULT_TRENDCATCHER_CONTRACT.observability.metrics
      };
    }
  }

  return overrides;
}

function parseContractOverrides(rawText: string): Partial<ExpansionMapperContract> {
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

  const overrides: Partial<ExpansionMapperContract> = {};
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
      ...DEFAULT_TRENDCATCHER_CONTRACT.retry,
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
      (entry): entry is ExpansionMapperContract["observability"]["events"][number] =>
        DEFAULT_TRENDCATCHER_CONTRACT.observability.events.includes(
          entry as ExpansionMapperContract["observability"]["events"][number]
        )
    );
    const filteredMetrics = metrics?.filter(
      (entry): entry is ExpansionMapperContract["observability"]["metrics"][number] =>
        DEFAULT_TRENDCATCHER_CONTRACT.observability.metrics.includes(
          entry as ExpansionMapperContract["observability"]["metrics"][number]
        )
    );
    overrides.observability = {
      events:
        filteredEvents && filteredEvents.length > 0
          ? filteredEvents
          : DEFAULT_TRENDCATCHER_CONTRACT.observability.events,
      metrics:
        filteredMetrics && filteredMetrics.length > 0
          ? filteredMetrics
          : DEFAULT_TRENDCATCHER_CONTRACT.observability.metrics
    };
  }

  return overrides;
}

function mergeContract(
  overrides: Partial<ExpansionMapperContract>,
  fallback: ExpansionMapperContract
): ExpansionMapperContract {
  return ExpansionMapperContractSchema.parse({
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

export class ExpansionMapperAgent {
  private readonly contractPaths: string[];

  private readonly now: () => Date;

  private readonly sleepFn: (delayMs: number) => Promise<void>;

  private readonly toolAdapters: ExpansionMapperToolAdapters;

  private lastMetrics: MarketMetrics = {
    durationMs: 0,
    retries: 0,
    toolCalls: 0,
    toolFailures: 0
  };

  constructor(options: ExpansionMapperAgentOptions = {}) {
    this.contractPaths = options.contractPath
      ? [options.contractPath]
      : [...DEFAULT_CONTRACT_PATHS];
    this.now = options.now ?? (() => new Date());
    this.sleepFn = options.sleep ?? sleep;
    this.toolAdapters = options.toolAdapters ?? createDefaultExpansionMapperToolAdapters();
  }

  getMetricsSnapshot(): MarketMetrics {
    return {
      ...this.lastMetrics
    };
  }

  async run(input: ExpansionMapperInput): Promise<ExpansionMapperOutput> {
    const parsedInput = ExpansionMapperInputSchema.parse(input);
    const startedAt = this.now();
    const events: MarketEvent[] = [];
    const metrics: MarketMetrics = {
      durationMs: 0,
      retries: 0,
      toolCalls: 0,
      toolFailures: 0
    };
    const fallbackReasons: string[] = [];

    const emitEvent = (
      event: Omit<MarketEvent, "timestamp"> & { timestamp?: string }
    ): void => {
      const normalized: MarketEvent = {
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
        toolId: "expansionmapper"
      },
      level: "info",
      message: "ExpansionMapper request accepted.",
      name: "expansionmapper.request.received"
    });

    const loadedContract = await this.loadContract();
    emitEvent({
      details: {
        source: loadedContract.source
      },
      level: "info",
      message: `Contract loaded from ${loadedContract.source}.`,
      name: "expansionmapper.contract.loaded"
    });

    const mappedTools = this.resolveToolIds(loadedContract.contract.toolIds);
    const effectiveTools =
      mappedTools.length > 0 ? mappedTools : [...TRENDCATCHER_TOOL_IDS];

    const runWithRetry = async <T>(
      toolId: TrendToolId,
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
          name: "expansionmapper.tool.call.started"
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
            name: "expansionmapper.tool.call.succeeded"
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
            name: "expansionmapper.tool.call.failed"
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
            name: "expansionmapper.retry.scheduled"
          });
          await this.sleepFn(delay);
        }
      }

      metrics.toolFailures += 1;
      throw lastError ?? new Error(`${toolId} failed with no details.`);
    };

    const toolInput: TrendToolInput = {
      endDate: parsedInput.window.endDate,
      segments: parsedInput.segments,
      startDate: parsedInput.window.startDate,
      targetSignalConfidencePct: parsedInput.targetSignalConfidencePct,
      tenantId: parsedInput.tenantId
    };

    let marketTrend = null;
    let socialSignal = null;
    let categoryGrowth = null;

    if (effectiveTools.includes("market-sentinel-feed")) {
      try {
        marketTrend = MarketTrendSnapshotSchema.parse(
          await runWithRetry("market-sentinel-feed", () =>
            this.toolAdapters.fetchMarketTrends(toolInput)
          )
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "market-sentinel-feed failed.";
        fallbackReasons.push(`market-sentinel-feed: ${message}`);
      }
    }

    if (effectiveTools.includes("macro-signal-stream")) {
      try {
        socialSignal = SocialSignalSnapshotSchema.parse(
          await runWithRetry("macro-signal-stream", () =>
            this.toolAdapters.fetchSocialSignals(toolInput)
          )
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "macro-signal-stream failed.";
        fallbackReasons.push(`macro-signal-stream: ${message}`);
      }
    }

    if (effectiveTools.includes("risk-opportunity-engine")) {
      try {
        categoryGrowth = CategoryGrowthSnapshotSchema.parse(
          await runWithRetry("risk-opportunity-engine", () =>
            this.toolAdapters.fetchCategoryGrowth(toolInput)
          )
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "risk-opportunity-engine failed.";
        fallbackReasons.push(`risk-opportunity-engine: ${message}`);
      }
    }

    const fallbackApplied = fallbackReasons.length > 0;
    const fallbackMode: TrendFailureMode | null = fallbackApplied
      ? loadedContract.contract.failureMode
      : null;

    if (fallbackApplied) {
      emitEvent({
        details: {
          fallbackMode: fallbackMode ?? undefined,
          source: "failure_behavior"
        },
        level: "warning",
        message: "Fallback behavior applied for ExpansionMapper output.",
        name: "expansionmapper.fallback.applied"
      });
    }

    const safeMarketTrend = marketTrend ?? {
      dominantTheme: "trend signal unavailable",
      momentumIndex: 0,
      trendVelocityPct: 0
    };
    const safeSocialSignal = socialSignal ?? {
      emergingTopic: "social signal unavailable",
      engagementLiftPct: 0,
      sentimentShiftPct: 0
    };
    const safeCategoryGrowth = categoryGrowth ?? {
      competitorPressurePct: 0,
      projectedCategoryGrowthPct: 0,
      whitespaceOpportunityPct: 0
    };

    const projectedSignalConfidencePct = Number(
      (
        safeMarketTrend.momentumIndex * 0.35 +
        safeMarketTrend.trendVelocityPct * 0.25 +
        safeSocialSignal.engagementLiftPct * 0.2 +
        safeCategoryGrowth.whitespaceOpportunityPct * 0.2 -
        safeCategoryGrowth.competitorPressurePct * 0.15
      ).toFixed(2)
    );

    const recommendedMonitoringFront =
      safeCategoryGrowth.whitespaceOpportunityPct >= safeMarketTrend.momentumIndex
        ? safeSocialSignal.emergingTopic
        : safeMarketTrend.dominantTheme;

    const status: ExpansionMapperOutput["status"] =
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
      message: "ExpansionMapper response generated.",
      name: "expansionmapper.response.generated"
    });

    const output = ExpansionMapperOutputSchema.parse({
      agent: "ExpansionMapper",
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
        ? "ExpansionMapper generated under fallback mode due to tool failures."
        : "ExpansionMapper generated with complete trend and momentum signal coverage.",
      marketBrief: {
        actions: [
          {
            owner: "CMO",
            priority: toPriority(100 - safeMarketTrend.momentumIndex + safeCategoryGrowth.competitorPressurePct),
            recommendation:
              "Prioritize fast-launch campaigns around the highest momentum trend cluster with weekly refresh.",
            targetDate: addDays(parsedInput.window.endDate, 5)
          },
          {
            owner: "Growth",
            priority: toPriority(safeSocialSignal.engagementLiftPct + Math.abs(safeSocialSignal.sentimentShiftPct)),
            recommendation:
              "Scale content formats that maximize engagement lift on emerging buyer narratives.",
            targetDate: addDays(parsedInput.window.endDate, 9)
          },
          {
            owner: "RevOps",
            priority: toPriority(safeCategoryGrowth.whitespaceOpportunityPct + safeCategoryGrowth.competitorPressurePct),
            recommendation:
              "Route whitespace opportunities to field teams with tighter win/loss trend instrumentation.",
            targetDate: addDays(parsedInput.window.endDate, 12)
          }
        ].slice(0, parsedInput.constraints.maxActions),
        headline: `Projected momentum ${projectedSignalConfidencePct.toFixed(
          2
        )} against growth target ${parsedInput.targetSignalConfidencePct.toFixed(2)}%.`,
        projectedSignalConfidencePct,
        recommendedMonitoringFront,
        riskSignals: [
          {
            mitigation:
              "Reallocate media and outbound focus to defend categories under high competitor pressure.",
            severity: toPriority(safeCategoryGrowth.competitorPressurePct + (100 - safeMarketTrend.momentumIndex)),
            signal: safeMarketTrend.dominantTheme
          },
          {
            mitigation:
              "Deploy narrative testing to stabilize sentiment where velocity exceeds confidence.",
            severity: toPriority(Math.abs(safeSocialSignal.sentimentShiftPct) + safeMarketTrend.trendVelocityPct),
            signal: safeSocialSignal.emergingTopic
          }
        ],
        signals: [
          {
            confidence: toConfidence(safeMarketTrend.momentumIndex),
            interpretation: "Momentum index tracks the strength of strategic trend continuation.",
            metric: "Momentum Index",
            value: safeMarketTrend.momentumIndex
          },
          {
            confidence: toConfidence(100 - safeCategoryGrowth.competitorPressurePct),
            interpretation: "Category growth captures expansion headroom vs market pressure.",
            metric: "Projected Category Growth %",
            value: safeCategoryGrowth.projectedCategoryGrowthPct
          },
          {
            confidence: toConfidence(50 + safeSocialSignal.sentimentShiftPct),
            interpretation: "Social sentiment shift captures narrative direction in target audiences.",
            metric: "Sentiment Shift %",
            value: safeSocialSignal.sentimentShiftPct
          }
        ]
      }
    });

    this.lastMetrics = {
      ...output.observability.metrics
    };
    return output;
  }

  private resolveToolIds(toolIds: string[]): TrendToolId[] {
    const mapped = toolIds
      .map((toolId) => normalizeTrendToolId(toolId))
      .filter((toolId): toolId is TrendToolId => toolId !== null);
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
          DEFAULT_TRENDCATCHER_CONTRACT
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
      contract: DEFAULT_TRENDCATCHER_CONTRACT,
      source: "default"
    };
  }
}
