// [SOURCE] BirthHub360_Agentes_Parallel_Plan - CulturePulse
import { access, readFile } from "node:fs/promises";
import path from "node:path";

import {
  type BrandEvent,
  type BrandFailureMode,
  type CulturePulseContract,
  CulturePulseContractSchema,
  type CulturePulseInput,
  CulturePulseInputSchema,
  type CulturePulseOutput,
  CulturePulseOutputSchema,
  type BrandMetrics,
  DEFAULT_BRANDGUARDIAN_CONTRACT
} from "./schemas.js";
import {
  BRANDGUARDIAN_TOOL_IDS,
  BrandSentimentSnapshotSchema,
  type CulturePulseToolAdapters,
  type BrandToolId,
  type BrandToolInput,
  createDefaultCulturePulseToolAdapters,
  GuidelineComplianceSnapshotSchema,
  normalizeBrandToolId,
  PRIncidentSnapshotSchema
} from "./tools.js";

const DEFAULT_AUDIT_CONTRACT_PATH = path.resolve(
  process.cwd(),
  "audit",
  "pending_review",
  "ciclo1_culturepulse",
  "contract.yaml"
);
const DEFAULT_AUDIT_CONTRACT_PATH_FROM_PACKAGE = path.resolve(
  process.cwd(),
  "..",
  "..",
  "audit",
  "pending_review",
  "ciclo1_culturepulse",
  "contract.yaml"
);
const DEFAULT_PACKAGE_CONTRACT_PATH = path.resolve(
  process.cwd(),
  "packages",
  "agents",
  "executives",
  "CulturePulse",
  "contract.yaml"
);
const DEFAULT_PACKAGE_CONTRACT_PATH_FROM_PACKAGE = path.resolve(
  process.cwd(),
  "executives",
  "CulturePulse",
  "contract.yaml"
);
const DEFAULT_CONTRACT_PATHS = [
  DEFAULT_AUDIT_CONTRACT_PATH,
  DEFAULT_AUDIT_CONTRACT_PATH_FROM_PACKAGE,
  DEFAULT_PACKAGE_CONTRACT_PATH,
  DEFAULT_PACKAGE_CONTRACT_PATH_FROM_PACKAGE
] as const;

interface CulturePulseAgentOptions {
  contractPath?: string;
  now?: () => Date;
  sleep?: (delayMs: number) => Promise<void>;
  toolAdapters?: CulturePulseToolAdapters;
}

interface LoadedContract {
  contract: CulturePulseContract;
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

function toFailureMode(rawValue: string | undefined): BrandFailureMode | undefined {
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
    return DEFAULT_BRANDGUARDIAN_CONTRACT.retry.maxAttempts;
  }
  return Math.min(3, Math.max(1, Math.trunc(value)));
}

function classifyContractSource(contractPath: string): LoadedContract["source"] {
  const normalized = path.normalize(contractPath).toLowerCase();
  if (
    normalized.endsWith(
      path
        .join("audit", "pending_review", "ciclo1_culturepulse", "contract.yaml")
        .toLowerCase()
    )
  ) {
    return "audit_file";
  }
  if (
    normalized.endsWith(
      path.join("executives", "CulturePulse", "contract.yaml").toLowerCase()
    )
  ) {
    return "file";
  }
  return "custom_file";
}

function parseContractOverridesFromObject(
  value: Record<string, unknown>
): Partial<CulturePulseContract> {
  const overrides: Partial<CulturePulseContract> = {};

  const toolIds =
    toStringArray(value.toolIds) ??
    toStringArray(value.tools) ??
    toStringArray(value.required_tools);
  if (toolIds) {
    overrides.toolIds = toolIds;
  }

  const retry = toRecord(value.retry);
  if (retry) {
    const retryOverride: Partial<CulturePulseContract["retry"]> = {};
    if (typeof retry.maxAttempts === "number") {
      retryOverride.maxAttempts = clampMaxAttempts(retry.maxAttempts);
    }
    if (typeof retry.baseDelayMs === "number") {
      retryOverride.baseDelayMs = retry.baseDelayMs;
    }
    if (Object.keys(retryOverride).length > 0) {
      overrides.retry = retryOverride as CulturePulseContract["retry"];
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
    const retryOverride: Partial<CulturePulseContract["retry"]> = {};

    if (toolUnavailable && typeof toolUnavailable.retry_attempts === "number") {
      retryOverride.maxAttempts = clampMaxAttempts(toolUnavailable.retry_attempts);
    }
    if (toolUnavailable && typeof toolUnavailable.base_delay_ms === "number") {
      retryOverride.baseDelayMs = toolUnavailable.base_delay_ms;
    }
    if (Object.keys(retryOverride).length > 0) {
      overrides.retry = {
        ...DEFAULT_BRANDGUARDIAN_CONTRACT.retry,
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
        (entry): entry is CulturePulseContract["observability"]["events"][number] =>
          DEFAULT_BRANDGUARDIAN_CONTRACT.observability.events.includes(
            entry as CulturePulseContract["observability"]["events"][number]
          )
      );
      const filteredMetrics = metrics?.filter(
        (entry): entry is CulturePulseContract["observability"]["metrics"][number] =>
          DEFAULT_BRANDGUARDIAN_CONTRACT.observability.metrics.includes(
            entry as CulturePulseContract["observability"]["metrics"][number]
          )
      );
      overrides.observability = {
        events:
          filteredEvents && filteredEvents.length > 0
            ? filteredEvents
            : DEFAULT_BRANDGUARDIAN_CONTRACT.observability.events,
        metrics:
          filteredMetrics && filteredMetrics.length > 0
            ? filteredMetrics
            : DEFAULT_BRANDGUARDIAN_CONTRACT.observability.metrics
      };
    }
  }

  return overrides;
}

function parseContractOverrides(rawText: string): Partial<CulturePulseContract> {
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

  const overrides: Partial<CulturePulseContract> = {};
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
      ...DEFAULT_BRANDGUARDIAN_CONTRACT.retry,
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
      (entry): entry is CulturePulseContract["observability"]["events"][number] =>
        DEFAULT_BRANDGUARDIAN_CONTRACT.observability.events.includes(
          entry as CulturePulseContract["observability"]["events"][number]
        )
    );
    const filteredMetrics = metrics?.filter(
      (entry): entry is CulturePulseContract["observability"]["metrics"][number] =>
        DEFAULT_BRANDGUARDIAN_CONTRACT.observability.metrics.includes(
          entry as CulturePulseContract["observability"]["metrics"][number]
        )
    );
    overrides.observability = {
      events:
        filteredEvents && filteredEvents.length > 0
          ? filteredEvents
          : DEFAULT_BRANDGUARDIAN_CONTRACT.observability.events,
      metrics:
        filteredMetrics && filteredMetrics.length > 0
          ? filteredMetrics
          : DEFAULT_BRANDGUARDIAN_CONTRACT.observability.metrics
    };
  }

  return overrides;
}

function mergeContract(
  overrides: Partial<CulturePulseContract>,
  fallback: CulturePulseContract
): CulturePulseContract {
  return CulturePulseContractSchema.parse({
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

export class CulturePulseAgent {
  private readonly contractPaths: string[];

  private readonly now: () => Date;

  private readonly sleepFn: (delayMs: number) => Promise<void>;

  private readonly toolAdapters: CulturePulseToolAdapters;

  private lastMetrics: BrandMetrics = {
    durationMs: 0,
    retries: 0,
    toolCalls: 0,
    toolFailures: 0
  };

  constructor(options: CulturePulseAgentOptions = {}) {
    this.contractPaths = options.contractPath
      ? [options.contractPath]
      : [...DEFAULT_CONTRACT_PATHS];
    this.now = options.now ?? (() => new Date());
    this.sleepFn = options.sleep ?? sleep;
    this.toolAdapters = options.toolAdapters ?? createDefaultCulturePulseToolAdapters();
  }

  getMetricsSnapshot(): BrandMetrics {
    return {
      ...this.lastMetrics
    };
  }

  async run(input: CulturePulseInput): Promise<CulturePulseOutput> {
    const parsedInput = CulturePulseInputSchema.parse(input);
    const startedAt = this.now();
    const events: BrandEvent[] = [];
    const metrics: BrandMetrics = {
      durationMs: 0,
      retries: 0,
      toolCalls: 0,
      toolFailures: 0
    };
    const fallbackReasons: string[] = [];

    const emitEvent = (
      event: Omit<BrandEvent, "timestamp"> & { timestamp?: string }
    ): void => {
      const normalized: BrandEvent = {
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
        toolId: "culturepulse"
      },
      level: "info",
      message: "CulturePulse request accepted.",
      name: "culturepulse.request.received"
    });

    const loadedContract = await this.loadContract();
    emitEvent({
      details: {
        source: loadedContract.source
      },
      level: "info",
      message: `Contract loaded from ${loadedContract.source}.`,
      name: "culturepulse.contract.loaded"
    });

    const mappedTools = this.resolveToolIds(loadedContract.contract.toolIds);
    const effectiveTools =
      mappedTools.length > 0 ? mappedTools : [...BRANDGUARDIAN_TOOL_IDS];

    const runWithRetry = async <T>(
      toolId: BrandToolId,
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
          name: "culturepulse.tool.call.started"
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
            name: "culturepulse.tool.call.succeeded"
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
            name: "culturepulse.tool.call.failed"
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
            name: "culturepulse.retry.scheduled"
          });
          await this.sleepFn(delay);
        }
      }

      metrics.toolFailures += 1;
      throw lastError ?? new Error(`${toolId} failed with no details.`);
    };

    const toolInput: BrandToolInput = {
      endDate: parsedInput.window.endDate,
      segments: parsedInput.segments,
      startDate: parsedInput.window.startDate,
      targetCultureHealthPct: parsedInput.targetCultureHealthPct,
      tenantId: parsedInput.tenantId
    };

    let sentiment = null;
    let compliance = null;
    let incidents = null;

    if (effectiveTools.includes("brand-sentiment-feed")) {
      try {
        sentiment = BrandSentimentSnapshotSchema.parse(
          await runWithRetry("brand-sentiment-feed", () =>
            this.toolAdapters.fetchBrandSentiment(toolInput)
          )
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "brand-sentiment-feed failed.";
        fallbackReasons.push(`brand-sentiment-feed: ${message}`);
      }
    }

    if (effectiveTools.includes("guideline-compliance-engine")) {
      try {
        compliance = GuidelineComplianceSnapshotSchema.parse(
          await runWithRetry("guideline-compliance-engine", () =>
            this.toolAdapters.fetchGuidelineCompliance(toolInput)
          )
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "guideline-compliance-engine failed.";
        fallbackReasons.push(`guideline-compliance-engine: ${message}`);
      }
    }

    if (effectiveTools.includes("pr-incident-monitor")) {
      try {
        incidents = PRIncidentSnapshotSchema.parse(
          await runWithRetry("pr-incident-monitor", () =>
            this.toolAdapters.fetchPRIncidents(toolInput)
          )
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "pr-incident-monitor failed.";
        fallbackReasons.push(`pr-incident-monitor: ${message}`);
      }
    }

    const fallbackApplied = fallbackReasons.length > 0;
    const fallbackMode: BrandFailureMode | null = fallbackApplied
      ? loadedContract.contract.failureMode
      : null;

    if (fallbackApplied) {
      emitEvent({
        details: {
          fallbackMode: fallbackMode ?? undefined,
          source: "failure_behavior"
        },
        level: "warning",
        message: "Fallback behavior applied for CulturePulse output.",
        name: "culturepulse.fallback.applied"
      });
    }

    const safeSentiment = sentiment ?? {
      currentSentimentPct: 0,
      dominantNarrative: "sentiment signal unavailable",
      volatilityPct: 0
    };
    const safeCompliance = compliance ?? {
      complianceScorePct: 0,
      driftDriver: "guideline signal unavailable",
      highRiskAssetsPct: 0
    };
    const safeIncidents = incidents ?? {
      activeIncidentCount: 0,
      responseReadinessPct: 0,
      severityIndex: 0
    };

    const projectedCultureHealthScore = Number(
      (
        safeSentiment.currentSentimentPct * 0.4 +
        safeCompliance.complianceScorePct * 0.35 +
        safeIncidents.responseReadinessPct * 0.25 -
        safeIncidents.severityIndex * 0.2 -
        safeCompliance.highRiskAssetsPct * 0.1
      ).toFixed(2)
    );

    const status: CulturePulseOutput["status"] =
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
      message: "CulturePulse response generated.",
      name: "culturepulse.response.generated"
    });

    const output = CulturePulseOutputSchema.parse({
      agent: "CulturePulse",
      cultureBrief: {
        actions: [
          {
            owner: "CMO",
            priority: toPriority(100 - safeSentiment.currentSentimentPct + safeSentiment.volatilityPct),
            recommendation:
              "Align narrative by region and publish executive talking points for high-volatility topics.",
            targetDate: addDays(parsedInput.window.endDate, 5)
          },
          {
            owner: "Brand Ops",
            priority: toPriority(100 - safeCompliance.complianceScorePct + safeCompliance.highRiskAssetsPct),
            recommendation:
              "Enforce preflight brand checks on partner and social assets before publication.",
            targetDate: addDays(parsedInput.window.endDate, 9)
          },
          {
            owner: "PR Lead",
            priority: toPriority(safeIncidents.severityIndex + safeIncidents.activeIncidentCount * 10),
            recommendation:
              "Run incident response drill and refresh response templates for top-risk scenarios.",
            targetDate: addDays(parsedInput.window.endDate, 12)
          }
        ].slice(0, parsedInput.constraints.maxActions),
        headline: `Projected brand health ${projectedCultureHealthScore.toFixed(
          2
        )} vs sentiment target ${parsedInput.targetCultureHealthPct.toFixed(2)}%.`,
        projectedCultureHealthScore,
        riskSignals: [
          {
            mitigation:
              "Centralize message governance for localized campaigns with weekly QA sampling.",
            severity: toPriority(safeSentiment.volatilityPct + safeCompliance.highRiskAssetsPct),
            signal: safeCompliance.driftDriver
          },
          {
            mitigation:
              "Escalate active incidents with severity-based runbooks and stakeholder updates.",
            severity: toPriority(safeIncidents.severityIndex + safeIncidents.activeIncidentCount * 8),
            signal: `${safeIncidents.activeIncidentCount} active PR incidents with severity index ${safeIncidents.severityIndex.toFixed(
              2
            )}.`
          }
        ],
        signals: [
          {
            confidence: toConfidence(safeSentiment.currentSentimentPct),
            interpretation:
              safeSentiment.currentSentimentPct >= parsedInput.targetCultureHealthPct
                ? "Current sentiment is aligned with strategic target."
                : "Current sentiment is below target and needs corrective narrative actions.",
            metric: "Current Sentiment %",
            value: safeSentiment.currentSentimentPct
          },
          {
            confidence: toConfidence(safeCompliance.complianceScorePct),
            interpretation: "Guideline compliance indicates consistency of external brand execution.",
            metric: "Compliance Score %",
            value: safeCompliance.complianceScorePct
          },
          {
            confidence: toConfidence(100 - safeIncidents.severityIndex),
            interpretation: "PR incident severity captures exposure risk to brand trust.",
            metric: "Incident Severity Index",
            value: safeIncidents.severityIndex
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
        ? "CulturePulse generated under fallback mode due to tool failures."
        : "CulturePulse generated with complete brand risk and compliance signals."
    });

    this.lastMetrics = {
      ...output.observability.metrics
    };
    return output;
  }

  private resolveToolIds(toolIds: string[]): BrandToolId[] {
    const mapped = toolIds
      .map((toolId) => normalizeBrandToolId(toolId))
      .filter((toolId): toolId is BrandToolId => toolId !== null);
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
          DEFAULT_BRANDGUARDIAN_CONTRACT
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
      contract: DEFAULT_BRANDGUARDIAN_CONTRACT,
      source: "default"
    };
  }
}
