// [SOURCE] BirthHub360_Agentes_Parallel_Plan - PipelineOracle
import { access, readFile } from "node:fs/promises";
import path from "node:path";

import {
  DEFAULT_QUOTAARCHITECT_CONTRACT,
  type PipelineOracleContract,
  PipelineOracleContractSchema,
  type PipelineOracleInput,
  PipelineOracleInputSchema,
  type PipelineOracleOutput,
  PipelineOracleOutputSchema,
  type QuotaEvent,
  type QuotaFailureMode,
  type QuotaMetrics
} from "./schemas.js";
import {
  AttainmentVarianceSnapshotSchema,
  CapacityPlannerSnapshotSchema,
  createDefaultPipelineOracleToolAdapters,
  normalizeQuotaToolId,
  QUOTAARCHITECT_TOOL_IDS,
  type PipelineOracleToolAdapters,
  type QuotaToolId,
  type QuotaToolInput,
  QuotaToolInputSchema,
  TerritoryCoverageSnapshotSchema
} from "./tools.js";

const DEFAULT_AUDIT_CONTRACT_PATH = path.resolve(
  process.cwd(),
  "audit",
  "pending_review",
  "ciclo1_pipelineoracle",
  "contract.yaml"
);
const DEFAULT_AUDIT_CONTRACT_PATH_FROM_PACKAGE = path.resolve(
  process.cwd(),
  "..",
  "..",
  "audit",
  "pending_review",
  "ciclo1_pipelineoracle",
  "contract.yaml"
);
const DEFAULT_PACKAGE_CONTRACT_PATH = path.resolve(
  process.cwd(),
  "packages",
  "agents",
  "executives",
  "PipelineOracle",
  "contract.yaml"
);
const DEFAULT_PACKAGE_CONTRACT_PATH_FROM_PACKAGE = path.resolve(
  process.cwd(),
  "executives",
  "PipelineOracle",
  "contract.yaml"
);
const DEFAULT_CONTRACT_PATHS = [
  DEFAULT_AUDIT_CONTRACT_PATH,
  DEFAULT_AUDIT_CONTRACT_PATH_FROM_PACKAGE,
  DEFAULT_PACKAGE_CONTRACT_PATH,
  DEFAULT_PACKAGE_CONTRACT_PATH_FROM_PACKAGE
] as const;

interface PipelineOracleAgentOptions {
  contractPath?: string;
  now?: () => Date;
  sleep?: (delayMs: number) => Promise<void>;
  toolAdapters?: PipelineOracleToolAdapters;
}

interface LoadedContract {
  contract: PipelineOracleContract;
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

function toFailureMode(rawValue: string | undefined): QuotaFailureMode | undefined {
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
    return DEFAULT_QUOTAARCHITECT_CONTRACT.retry.maxAttempts;
  }
  return Math.min(3, Math.max(1, Math.trunc(value)));
}

function classifyContractSource(contractPath: string): LoadedContract["source"] {
  const normalized = path.normalize(contractPath).toLowerCase();
  if (
    normalized.endsWith(
      path
        .join("audit", "pending_review", "ciclo1_pipelineoracle", "contract.yaml")
        .toLowerCase()
    )
  ) {
    return "audit_file";
  }
  if (
    normalized.endsWith(
      path.join("executives", "PipelineOracle", "contract.yaml").toLowerCase()
    )
  ) {
    return "file";
  }
  return "custom_file";
}

function parseContractOverridesFromObject(
  value: Record<string, unknown>
): Partial<PipelineOracleContract> {
  const overrides: Partial<PipelineOracleContract> = {};

  const toolIds =
    toStringArray(value.toolIds) ??
    toStringArray(value.tools) ??
    toStringArray(value.required_tools);
  if (toolIds) {
    overrides.toolIds = toolIds;
  }

  const retry = toRecord(value.retry);
  if (retry) {
    const retryOverride: Partial<PipelineOracleContract["retry"]> = {};
    if (typeof retry.maxAttempts === "number") {
      retryOverride.maxAttempts = clampMaxAttempts(retry.maxAttempts);
    }
    if (typeof retry.baseDelayMs === "number") {
      retryOverride.baseDelayMs = retry.baseDelayMs;
    }
    if (Object.keys(retryOverride).length > 0) {
      overrides.retry = retryOverride as PipelineOracleContract["retry"];
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
    const retryOverride: Partial<PipelineOracleContract["retry"]> = {};

    if (toolUnavailable && typeof toolUnavailable.retry_attempts === "number") {
      retryOverride.maxAttempts = clampMaxAttempts(toolUnavailable.retry_attempts);
    }
    if (toolUnavailable && typeof toolUnavailable.base_delay_ms === "number") {
      retryOverride.baseDelayMs = toolUnavailable.base_delay_ms;
    }
    if (Object.keys(retryOverride).length > 0) {
      overrides.retry = {
        ...DEFAULT_QUOTAARCHITECT_CONTRACT.retry,
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
        (entry): entry is PipelineOracleContract["observability"]["events"][number] =>
          DEFAULT_QUOTAARCHITECT_CONTRACT.observability.events.includes(
            entry as PipelineOracleContract["observability"]["events"][number]
          )
      );
      const filteredMetrics = metrics?.filter(
        (entry): entry is PipelineOracleContract["observability"]["metrics"][number] =>
          DEFAULT_QUOTAARCHITECT_CONTRACT.observability.metrics.includes(
            entry as PipelineOracleContract["observability"]["metrics"][number]
          )
      );
      overrides.observability = {
        events:
          filteredEvents && filteredEvents.length > 0
            ? filteredEvents
            : DEFAULT_QUOTAARCHITECT_CONTRACT.observability.events,
        metrics:
          filteredMetrics && filteredMetrics.length > 0
            ? filteredMetrics
            : DEFAULT_QUOTAARCHITECT_CONTRACT.observability.metrics
      };
    }
  }

  return overrides;
}

function parseContractOverrides(rawText: string): Partial<PipelineOracleContract> {
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

  const overrides: Partial<PipelineOracleContract> = {};
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
      ...DEFAULT_QUOTAARCHITECT_CONTRACT.retry,
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
      (entry): entry is PipelineOracleContract["observability"]["events"][number] =>
        DEFAULT_QUOTAARCHITECT_CONTRACT.observability.events.includes(
          entry as PipelineOracleContract["observability"]["events"][number]
        )
    );
    const filteredMetrics = metrics?.filter(
      (entry): entry is PipelineOracleContract["observability"]["metrics"][number] =>
        DEFAULT_QUOTAARCHITECT_CONTRACT.observability.metrics.includes(
          entry as PipelineOracleContract["observability"]["metrics"][number]
        )
    );
    overrides.observability = {
      events:
        filteredEvents && filteredEvents.length > 0
          ? filteredEvents
          : DEFAULT_QUOTAARCHITECT_CONTRACT.observability.events,
      metrics:
        filteredMetrics && filteredMetrics.length > 0
          ? filteredMetrics
          : DEFAULT_QUOTAARCHITECT_CONTRACT.observability.metrics
    };
  }

  return overrides;
}

function mergeContract(
  overrides: Partial<PipelineOracleContract>,
  fallback: PipelineOracleContract
): PipelineOracleContract {
  return PipelineOracleContractSchema.parse({
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

export class PipelineOracleAgent {
  private readonly contractPaths: string[];

  private readonly now: () => Date;

  private readonly sleepFn: (delayMs: number) => Promise<void>;

  private readonly toolAdapters: PipelineOracleToolAdapters;

  private lastMetrics: QuotaMetrics = {
    durationMs: 0,
    retries: 0,
    toolCalls: 0,
    toolFailures: 0
  };

  constructor(options: PipelineOracleAgentOptions = {}) {
    this.contractPaths = options.contractPath
      ? [options.contractPath]
      : [...DEFAULT_CONTRACT_PATHS];
    this.now = options.now ?? (() => new Date());
    this.sleepFn = options.sleep ?? sleep;
    this.toolAdapters = options.toolAdapters ?? createDefaultPipelineOracleToolAdapters();
  }

  getMetricsSnapshot(): QuotaMetrics {
    return {
      ...this.lastMetrics
    };
  }

  async run(input: PipelineOracleInput): Promise<PipelineOracleOutput> {
    const parsedInput = PipelineOracleInputSchema.parse(input);
    const startedAt = this.now();
    const events: QuotaEvent[] = [];
    const metrics: QuotaMetrics = {
      durationMs: 0,
      retries: 0,
      toolCalls: 0,
      toolFailures: 0
    };
    const fallbackReasons: string[] = [];

    const emitEvent = (
      event: Omit<QuotaEvent, "timestamp"> & { timestamp?: string }
    ): void => {
      const normalized: QuotaEvent = {
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
        toolId: "pipelineoracle"
      },
      level: "info",
      message: "PipelineOracle request accepted.",
      name: "pipelineoracle.request.received"
    });

    const loadedContract = await this.loadContract();
    emitEvent({
      details: {
        source: loadedContract.source
      },
      level: "info",
      message: `Contract loaded from ${loadedContract.source}.`,
      name: "pipelineoracle.contract.loaded"
    });

    const mappedTools = this.resolveToolIds(loadedContract.contract.toolIds);
    const effectiveTools =
      mappedTools.length > 0 ? mappedTools : [...QUOTAARCHITECT_TOOL_IDS];

    const runWithRetry = async <T>(
      toolId: QuotaToolId,
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
          name: "pipelineoracle.tool.call.started"
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
            name: "pipelineoracle.tool.call.succeeded"
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
            name: "pipelineoracle.tool.call.failed"
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
            name: "pipelineoracle.retry.scheduled"
          });
          await this.sleepFn(delay);
        }
      }

      metrics.toolFailures += 1;
      throw lastError ?? new Error(`${toolId} failed with no details.`);
    };

    const toolInput: QuotaToolInput = QuotaToolInputSchema.parse({
      endDate: parsedInput.window.endDate,
      segments: parsedInput.segments,
      startDate: parsedInput.window.startDate,
      targetQuotaAttainmentPct: parsedInput.targetQuotaAttainmentPct,
      tenantId: parsedInput.tenantId
    });

    let capacity = null;
    let coverage = null;
    let attainment = null;

    if (effectiveTools.includes("capacity-planner-feed")) {
      try {
        capacity = CapacityPlannerSnapshotSchema.parse(
          await runWithRetry("capacity-planner-feed", () =>
            this.toolAdapters.fetchCapacityPlanner(toolInput)
          )
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "capacity-planner-feed failed.";
        fallbackReasons.push(`capacity-planner-feed: ${message}`);
      }
    }

    if (effectiveTools.includes("territory-coverage-engine")) {
      try {
        coverage = TerritoryCoverageSnapshotSchema.parse(
          await runWithRetry("territory-coverage-engine", () =>
            this.toolAdapters.fetchTerritoryCoverage(toolInput)
          )
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "territory-coverage-engine failed.";
        fallbackReasons.push(`territory-coverage-engine: ${message}`);
      }
    }

    if (effectiveTools.includes("attainment-variance-feed")) {
      try {
        attainment = AttainmentVarianceSnapshotSchema.parse(
          await runWithRetry("attainment-variance-feed", () =>
            this.toolAdapters.fetchAttainmentVariance(toolInput)
          )
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "attainment-variance-feed failed.";
        fallbackReasons.push(`attainment-variance-feed: ${message}`);
      }
    }

    const fallbackApplied = fallbackReasons.length > 0;
    const fallbackMode: QuotaFailureMode | null = fallbackApplied
      ? loadedContract.contract.failureMode
      : null;

    if (fallbackApplied) {
      emitEvent({
        details: {
          fallbackMode: fallbackMode ?? undefined,
          source: "failure_behavior"
        },
        level: "warning",
        message: "Fallback behavior applied for PipelineOracle output.",
        name: "pipelineoracle.fallback.applied"
      });
    }

    const safeCapacity = capacity ?? {
      availableSellingCapacityPct: 0,
      hiringReadinessPct: 0,
      rampRiskPct: 0
    };
    const safeCoverage = coverage ?? {
      coverageBalanceIndex: 0,
      overloadedTerritoriesPct: 0,
      whitespacePressurePct: 0
    };
    const safeAttainment = attainment ?? {
      projectedAttainmentPct: 0,
      topVarianceDriver: "attainment variance signal unavailable",
      varianceToPlanPct: 0
    };

    const recommendedQuotaDeltaPct = Number(
      (
        safeCoverage.coverageBalanceIndex * 0.12 +
        safeCapacity.availableSellingCapacityPct * 0.08 -
        safeCapacity.rampRiskPct * 0.09 -
        safeCoverage.overloadedTerritoriesPct * 0.05
      ).toFixed(2)
    );

    const projectedAttainmentPct = Number(
      (
        safeAttainment.projectedAttainmentPct +
        recommendedQuotaDeltaPct * 0.25 -
        safeCapacity.rampRiskPct * 0.1
      ).toFixed(2)
    );

    const status: PipelineOracleOutput["status"] =
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
      message: "PipelineOracle response generated.",
      name: "pipelineoracle.response.generated"
    });

    const output = PipelineOracleOutputSchema.parse({
      agent: "PipelineOracle",
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
      quotaBrief: {
        actions: [
          {
            owner: "CRO",
            priority: toPriority(100 - safeCoverage.coverageBalanceIndex + safeCoverage.overloadedTerritoriesPct),
            recommendation:
              "Rebalance high-load territories and redistribute quota by whitespace potential.",
            targetDate: addDays(parsedInput.window.endDate, 7)
          },
          {
            owner: "Sales Ops",
            priority: toPriority(100 - safeCapacity.availableSellingCapacityPct + safeCapacity.rampRiskPct),
            recommendation:
              "Align quota loading with confirmed ramp capacity before quarter rollover.",
            targetDate: addDays(parsedInput.window.endDate, 10)
          },
          {
            owner: "RevOps",
            priority: toPriority(Math.abs(safeAttainment.varianceToPlanPct) + safeCoverage.whitespacePressurePct),
            recommendation:
              "Apply attainment variance guardrails and dynamic quota adjustment windows by segment.",
            targetDate: addDays(parsedInput.window.endDate, 14)
          }
        ].slice(0, parsedInput.constraints.maxActions),
        headline: `Projected quota attainment ${projectedAttainmentPct.toFixed(
          2
        )}% vs target ${parsedInput.targetQuotaAttainmentPct.toFixed(2)}%.`,
        projectedAttainmentPct,
        recommendedQuotaDeltaPct,
        riskSignals: [
          {
            mitigation:
              "Deploy interim overlays in overloaded territories until rebalance is completed.",
            severity: toPriority(safeCoverage.overloadedTerritoriesPct + (100 - safeCoverage.coverageBalanceIndex)),
            signal: safeAttainment.topVarianceDriver
          },
          {
            mitigation:
              "Accelerate enablement and manager coaching for reps in ramp-sensitive cohorts.",
            severity: toPriority(safeCapacity.rampRiskPct + (100 - safeCapacity.hiringReadinessPct)),
            signal: `Ramp risk at ${safeCapacity.rampRiskPct.toFixed(2)}%.`
          }
        ],
        signals: [
          {
            confidence: toConfidence(safeCapacity.availableSellingCapacityPct),
            interpretation:
              safeCapacity.availableSellingCapacityPct >= 60
                ? "Selling capacity supports planned quota load."
                : "Selling capacity is constrained for current quota ambition.",
            metric: "Available Selling Capacity %",
            value: safeCapacity.availableSellingCapacityPct
          },
          {
            confidence: toConfidence(safeCoverage.coverageBalanceIndex),
            interpretation: "Coverage balance measures fairness and efficiency of quota distribution.",
            metric: "Coverage Balance Index",
            value: safeCoverage.coverageBalanceIndex
          },
          {
            confidence: toConfidence(100 - Math.abs(safeAttainment.varianceToPlanPct)),
            interpretation: "Variance to plan shows projected attainment divergence risk.",
            metric: "Variance To Plan %",
            value: safeAttainment.varianceToPlanPct
          }
        ]
      },
      status,
      summary: fallbackApplied
        ? "PipelineOracle generated under fallback mode due to tool failures."
        : "PipelineOracle generated with complete quota planning coverage."
    });

    this.lastMetrics = {
      ...output.observability.metrics
    };
    return output;
  }

  private resolveToolIds(toolIds: string[]): QuotaToolId[] {
    const mapped = toolIds
      .map((toolId) => normalizeQuotaToolId(toolId))
      .filter((toolId): toolId is QuotaToolId => toolId !== null);
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
          DEFAULT_QUOTAARCHITECT_CONTRACT
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
      contract: DEFAULT_QUOTAARCHITECT_CONTRACT,
      source: "default"
    };
  }
}
