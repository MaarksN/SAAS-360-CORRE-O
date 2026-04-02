// [SOURCE] BirthHub360_Agentes_Parallel_Plan - NarrativeWeaver
import { access, readFile } from "node:fs/promises";
import path from "node:path";

import {
  DEFAULT_NARRATIVEWEAVER_CONTRACT,
  type NarrativeEvent,
  type NarrativeFailureMode,
  type NarrativeMetrics,
  type NarrativeWeaverContract,
  NarrativeWeaverContractSchema,
  type NarrativeWeaverInput,
  NarrativeWeaverInputSchema,
  type NarrativeWeaverOutput,
  NarrativeWeaverOutputSchema
} from "./schemas.js";
import {
  createDefaultNarrativeWeaverToolAdapters,
  EarningsSignalSnapshotSchema,
  NARRATIVEWEAVER_TOOL_IDS,
  normalizeNarrativeToolId,
  type NarrativeToolId,
  type NarrativeToolInput,
  type NarrativeWeaverToolAdapters,
  StakeholderSentimentSnapshotSchema,
  StrategyCoherenceSnapshotSchema
} from "./tools.js";

const DEFAULT_AUDIT_CONTRACT_PATH = path.resolve(
  process.cwd(),
  "audit",
  "pending_review",
  "ciclo1_narrativeweaver",
  "contract.yaml"
);
const DEFAULT_AUDIT_CONTRACT_PATH_FROM_PACKAGE = path.resolve(
  process.cwd(),
  "..",
  "..",
  "audit",
  "pending_review",
  "ciclo1_narrativeweaver",
  "contract.yaml"
);
const DEFAULT_PACKAGE_CONTRACT_PATH = path.resolve(
  process.cwd(),
  "packages",
  "agents",
  "executives",
  "NarrativeWeaver",
  "contract.yaml"
);
const DEFAULT_PACKAGE_CONTRACT_PATH_FROM_PACKAGE = path.resolve(
  process.cwd(),
  "executives",
  "NarrativeWeaver",
  "contract.yaml"
);
const DEFAULT_CONTRACT_PATHS = [
  DEFAULT_AUDIT_CONTRACT_PATH,
  DEFAULT_AUDIT_CONTRACT_PATH_FROM_PACKAGE,
  DEFAULT_PACKAGE_CONTRACT_PATH,
  DEFAULT_PACKAGE_CONTRACT_PATH_FROM_PACKAGE
] as const;

interface NarrativeWeaverAgentOptions {
  contractPath?: string;
  now?: () => Date;
  sleep?: (delayMs: number) => Promise<void>;
  toolAdapters?: NarrativeWeaverToolAdapters;
}

interface LoadedContract {
  contract: NarrativeWeaverContract;
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

function toFailureMode(rawValue: string | undefined): NarrativeFailureMode | undefined {
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
    return DEFAULT_NARRATIVEWEAVER_CONTRACT.retry.maxAttempts;
  }
  return Math.min(3, Math.max(1, Math.trunc(value)));
}

function classifyContractSource(contractPath: string): LoadedContract["source"] {
  const normalized = path.normalize(contractPath).toLowerCase();
  if (
    normalized.endsWith(
      path
        .join("audit", "pending_review", "ciclo1_narrativeweaver", "contract.yaml")
        .toLowerCase()
    )
  ) {
    return "audit_file";
  }
  if (
    normalized.endsWith(
      path.join("executives", "NarrativeWeaver", "contract.yaml").toLowerCase()
    )
  ) {
    return "file";
  }
  return "custom_file";
}

function parseContractOverridesFromObject(
  value: Record<string, unknown>
): Partial<NarrativeWeaverContract> {
  const overrides: Partial<NarrativeWeaverContract> = {};

  const toolIds =
    toStringArray(value.toolIds) ??
    toStringArray(value.tools) ??
    toStringArray(value.required_tools);
  if (toolIds) {
    overrides.toolIds = toolIds;
  }

  const retry = toRecord(value.retry);
  if (retry) {
    const retryOverride: Partial<NarrativeWeaverContract["retry"]> = {};
    if (typeof retry.maxAttempts === "number") {
      retryOverride.maxAttempts = clampMaxAttempts(retry.maxAttempts);
    }
    if (typeof retry.baseDelayMs === "number") {
      retryOverride.baseDelayMs = retry.baseDelayMs;
    }
    if (Object.keys(retryOverride).length > 0) {
      overrides.retry = retryOverride as NarrativeWeaverContract["retry"];
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
    const retryOverride: Partial<NarrativeWeaverContract["retry"]> = {};

    if (toolUnavailable && typeof toolUnavailable.retry_attempts === "number") {
      retryOverride.maxAttempts = clampMaxAttempts(toolUnavailable.retry_attempts);
    }
    if (toolUnavailable && typeof toolUnavailable.base_delay_ms === "number") {
      retryOverride.baseDelayMs = toolUnavailable.base_delay_ms;
    }
    if (Object.keys(retryOverride).length > 0) {
      overrides.retry = {
        ...DEFAULT_NARRATIVEWEAVER_CONTRACT.retry,
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
        (
          entry
        ): entry is NarrativeWeaverContract["observability"]["events"][number] =>
          DEFAULT_NARRATIVEWEAVER_CONTRACT.observability.events.includes(
            entry as NarrativeWeaverContract["observability"]["events"][number]
          )
      );
      const filteredMetrics = metrics?.filter(
        (
          entry
        ): entry is NarrativeWeaverContract["observability"]["metrics"][number] =>
          DEFAULT_NARRATIVEWEAVER_CONTRACT.observability.metrics.includes(
            entry as NarrativeWeaverContract["observability"]["metrics"][number]
          )
      );
      overrides.observability = {
        events:
          filteredEvents && filteredEvents.length > 0
            ? filteredEvents
            : DEFAULT_NARRATIVEWEAVER_CONTRACT.observability.events,
        metrics:
          filteredMetrics && filteredMetrics.length > 0
            ? filteredMetrics
            : DEFAULT_NARRATIVEWEAVER_CONTRACT.observability.metrics
      };
    }
  }

  return overrides;
}

function parseContractOverrides(rawText: string): Partial<NarrativeWeaverContract> {
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

  const overrides: Partial<NarrativeWeaverContract> = {};
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
      ...DEFAULT_NARRATIVEWEAVER_CONTRACT.retry,
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
      (
        entry
      ): entry is NarrativeWeaverContract["observability"]["events"][number] =>
        DEFAULT_NARRATIVEWEAVER_CONTRACT.observability.events.includes(
          entry as NarrativeWeaverContract["observability"]["events"][number]
        )
    );
    const filteredMetrics = metrics?.filter(
      (
        entry
      ): entry is NarrativeWeaverContract["observability"]["metrics"][number] =>
        DEFAULT_NARRATIVEWEAVER_CONTRACT.observability.metrics.includes(
          entry as NarrativeWeaverContract["observability"]["metrics"][number]
        )
    );
    overrides.observability = {
      events:
        filteredEvents && filteredEvents.length > 0
          ? filteredEvents
          : DEFAULT_NARRATIVEWEAVER_CONTRACT.observability.events,
      metrics:
        filteredMetrics && filteredMetrics.length > 0
          ? filteredMetrics
          : DEFAULT_NARRATIVEWEAVER_CONTRACT.observability.metrics
    };
  }

  return overrides;
}

function mergeContract(
  overrides: Partial<NarrativeWeaverContract>,
  fallback: NarrativeWeaverContract
): NarrativeWeaverContract {
  return NarrativeWeaverContractSchema.parse({
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

export class NarrativeWeaverAgent {
  private readonly contractPaths: string[];

  private readonly now: () => Date;

  private readonly sleepFn: (delayMs: number) => Promise<void>;

  private readonly toolAdapters: NarrativeWeaverToolAdapters;

  private lastMetrics: NarrativeMetrics = {
    durationMs: 0,
    retries: 0,
    toolCalls: 0,
    toolFailures: 0
  };

  constructor(options: NarrativeWeaverAgentOptions = {}) {
    this.contractPaths = options.contractPath
      ? [options.contractPath]
      : [...DEFAULT_CONTRACT_PATHS];
    this.now = options.now ?? (() => new Date());
    this.sleepFn = options.sleep ?? sleep;
    this.toolAdapters = options.toolAdapters ?? createDefaultNarrativeWeaverToolAdapters();
  }

  getMetricsSnapshot(): NarrativeMetrics {
    return {
      ...this.lastMetrics
    };
  }

  async run(input: NarrativeWeaverInput): Promise<NarrativeWeaverOutput> {
    const parsedInput = NarrativeWeaverInputSchema.parse(input);
    const startedAt = this.now();
    const events: NarrativeEvent[] = [];
    const metrics: NarrativeMetrics = {
      durationMs: 0,
      retries: 0,
      toolCalls: 0,
      toolFailures: 0
    };
    const fallbackReasons: string[] = [];

    const emitEvent = (
      event: Omit<NarrativeEvent, "timestamp"> & { timestamp?: string }
    ): void => {
      const normalized: NarrativeEvent = {
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
        toolId: "narrativeweaver"
      },
      level: "info",
      message: "NarrativeWeaver request accepted.",
      name: "narrativeweaver.request.received"
    });

    const loadedContract = await this.loadContract();
    emitEvent({
      details: {
        source: loadedContract.source
      },
      level: "info",
      message: `Contract loaded from ${loadedContract.source}.`,
      name: "narrativeweaver.contract.loaded"
    });

    const mappedTools = this.resolveToolIds(loadedContract.contract.toolIds);
    const effectiveTools =
      mappedTools.length > 0 ? mappedTools : [...NARRATIVEWEAVER_TOOL_IDS];

    const runWithRetry = async <T>(
      toolId: NarrativeToolId,
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
          name: "narrativeweaver.tool.call.started"
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
            name: "narrativeweaver.tool.call.succeeded"
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
            name: "narrativeweaver.tool.call.failed"
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
            name: "narrativeweaver.retry.scheduled"
          });
          await this.sleepFn(delay);
        }
      }

      metrics.toolFailures += 1;
      throw lastError ?? new Error(`${toolId} failed with no details.`);
    };

    const toolInput: NarrativeToolInput = {
      audiences: parsedInput.audiences,
      endDate: parsedInput.window.endDate,
      startDate: parsedInput.window.startDate,
      targetClarityScorePct: parsedInput.targetClarityScorePct,
      tenantId: parsedInput.tenantId
    };

    let earningsSignal = null;
    let stakeholderSentiment = null;
    let strategyCoherence = null;

    if (effectiveTools.includes("earnings-signal-feed")) {
      try {
        earningsSignal = EarningsSignalSnapshotSchema.parse(
          await runWithRetry("earnings-signal-feed", () =>
            this.toolAdapters.fetchEarningsSignal(toolInput)
          )
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "earnings-signal-feed failed.";
        fallbackReasons.push(`earnings-signal-feed: ${message}`);
      }
    }

    if (effectiveTools.includes("stakeholder-sentiment-stream")) {
      try {
        stakeholderSentiment = StakeholderSentimentSnapshotSchema.parse(
          await runWithRetry("stakeholder-sentiment-stream", () =>
            this.toolAdapters.fetchStakeholderSentiment(toolInput)
          )
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "stakeholder-sentiment-stream failed.";
        fallbackReasons.push(`stakeholder-sentiment-stream: ${message}`);
      }
    }

    if (effectiveTools.includes("strategy-coherence-engine")) {
      try {
        strategyCoherence = StrategyCoherenceSnapshotSchema.parse(
          await runWithRetry("strategy-coherence-engine", () =>
            this.toolAdapters.fetchStrategyCoherence(toolInput)
          )
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "strategy-coherence-engine failed.";
        fallbackReasons.push(`strategy-coherence-engine: ${message}`);
      }
    }

    const fallbackApplied = fallbackReasons.length > 0;
    const fallbackMode: NarrativeFailureMode | null = fallbackApplied
      ? loadedContract.contract.failureMode
      : null;

    if (fallbackApplied) {
      emitEvent({
        details: {
          fallbackMode: fallbackMode ?? undefined,
          source: "failure_behavior"
        },
        level: "warning",
        message: "Fallback behavior applied for NarrativeWeaver output.",
        name: "narrativeweaver.fallback.applied"
      });
    }

    const safeEarnings = earningsSignal ?? {
      dominantDriver: "earnings signal unavailable",
      guidanceConfidencePct: 0,
      varianceNarrativeRiskPct: 0
    };
    const safeStakeholder = stakeholderSentiment ?? {
      boardAlignmentPct: 0,
      concernTopic: "stakeholder concern unavailable",
      investorConfidenceShiftPct: 0
    };
    const safeStrategy = strategyCoherence ?? {
      executionCredibilityPct: 0,
      messageConsistencyPct: 0,
      narrativeGapPct: 0
    };

    const projectedClarityScorePct = Number(
      (
        safeStrategy.messageConsistencyPct * 0.35 +
        safeStrategy.executionCredibilityPct * 0.25 +
        safeEarnings.guidanceConfidencePct * 0.2 +
        safeStakeholder.boardAlignmentPct * 0.2 -
        safeEarnings.varianceNarrativeRiskPct * 0.15 -
        safeStrategy.narrativeGapPct * 0.1
      ).toFixed(2)
    );

    const recommendedNarrativeTheme =
      safeStrategy.narrativeGapPct > 30
        ? safeStakeholder.concernTopic
        : safeEarnings.dominantDriver;

    const status: NarrativeWeaverOutput["status"] =
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
      message: "NarrativeWeaver response generated.",
      name: "narrativeweaver.response.generated"
    });

    const output = NarrativeWeaverOutputSchema.parse({
      agent: "NarrativeWeaver",
      domain: "executivos",
      fallback: {
        applied: fallbackApplied,
        mode: fallbackMode,
        reasons: fallbackReasons
      },
      generatedAt: this.now().toISOString(),
      narrativeBrief: {
        actions: [
          {
            owner: "CEO",
            priority: toPriority(100 - safeStrategy.messageConsistencyPct + safeStrategy.narrativeGapPct),
            recommendation:
              "Anchor the board storyline on one strategic driver with explicit quarter-over-quarter proof points.",
            targetDate: addDays(parsedInput.window.endDate, 4)
          },
          {
            owner: "CFO",
            priority: toPriority(safeEarnings.varianceNarrativeRiskPct + Math.abs(safeStakeholder.investorConfidenceShiftPct)),
            recommendation:
              "Pair guidance assumptions with downside ranges and leading indicators to reduce interpretation drift.",
            targetDate: addDays(parsedInput.window.endDate, 8)
          },
          {
            owner: "Investor Relations",
            priority: toPriority(100 - safeStakeholder.boardAlignmentPct + safeStrategy.narrativeGapPct),
            recommendation:
              "Publish a synchronized Q&A deck for executives and investors to keep message consistency above target.",
            targetDate: addDays(parsedInput.window.endDate, 11)
          }
        ].slice(0, parsedInput.constraints.maxActions),
        headline: `Projected narrative clarity ${projectedClarityScorePct.toFixed(
          2
        )}% vs target ${parsedInput.targetClarityScorePct.toFixed(2)}%.`,
        projectedClarityScorePct,
        recommendedNarrativeTheme,
        riskSignals: [
          {
            mitigation:
              "Standardize executive talking points and enforce single-source narrative assets before external comms.",
            severity: toPriority(safeStrategy.narrativeGapPct + (100 - safeStrategy.messageConsistencyPct)),
            signal: safeStakeholder.concernTopic
          },
          {
            mitigation:
              "Escalate high-variance assumptions to weekly review until confidence stabilizes above threshold.",
            severity: toPriority(safeEarnings.varianceNarrativeRiskPct + Math.abs(safeStakeholder.investorConfidenceShiftPct)),
            signal: safeEarnings.dominantDriver
          }
        ],
        signals: [
          {
            confidence: toConfidence(safeStrategy.messageConsistencyPct),
            interpretation:
              "Message consistency estimates alignment between leadership, board, and external narrative.",
            metric: "Message Consistency %",
            value: safeStrategy.messageConsistencyPct
          },
          {
            confidence: toConfidence(safeEarnings.guidanceConfidencePct),
            interpretation:
              "Guidance confidence measures robustness of the financial storyline under execution variability.",
            metric: "Guidance Confidence %",
            value: safeEarnings.guidanceConfidencePct
          },
          {
            confidence: toConfidence(50 + safeStakeholder.investorConfidenceShiftPct),
            interpretation:
              "Investor confidence shift indicates directional trust movement in current strategic messaging.",
            metric: "Investor Confidence Shift %",
            value: safeStakeholder.investorConfidenceShiftPct
          }
        ]
      },
      observability: {
        events,
        metrics
      },
      status,
      summary: fallbackApplied
        ? "NarrativeWeaver generated under fallback mode due to tool failures."
        : "NarrativeWeaver generated with complete narrative coherence and stakeholder signal coverage."
    });

    this.lastMetrics = {
      ...output.observability.metrics
    };
    return output;
  }

  private resolveToolIds(toolIds: string[]): NarrativeToolId[] {
    const mapped = toolIds
      .map((toolId) => normalizeNarrativeToolId(toolId))
      .filter((toolId): toolId is NarrativeToolId => toolId !== null);
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
          DEFAULT_NARRATIVEWEAVER_CONTRACT
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
      contract: DEFAULT_NARRATIVEWEAVER_CONTRACT,
      source: "default"
    };
  }
}
