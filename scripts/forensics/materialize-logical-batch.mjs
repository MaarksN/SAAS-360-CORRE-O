import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const DEFAULT_COUNT = 100;

function parseArgs(argv) {
  const options = {};

  for (const arg of argv) {
    if (arg.startsWith("--count=")) {
      options.count = Number.parseInt(arg.slice("--count=".length), 10);
      continue;
    }

    if (arg.startsWith("--output=")) {
      options.output = arg.slice("--output=".length);
    }
  }

  return options;
}

function phaseSortKey(phase) {
  return Number.parseInt(phase.replace("F", ""), 10);
}

function getPhaseStartNumber(phase) {
  return 2 + phaseSortKey(phase) * 48;
}

function normalizeStatus(status) {
  const upper = status.toUpperCase();

  if (upper.includes("CONCLU")) {
    return "done";
  }

  if (upper.includes("NAO ENCONTRADO") || upper.includes("NÃO ENCONTRADO")) {
    return "missing";
  }

  if (upper.includes("APENAS DOCUMENTADO")) {
    return "doc-only";
  }

  return "pending";
}

function decodeHtml(text) {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseBacklog(promptPath) {
  const text = readFileSync(promptPath, "utf8");
  const entries = [];
  const matcher = /\[(F\d+)-(\d+)\]\s+([^\r\n]+)/g;

  for (const match of text.matchAll(matcher)) {
    const phase = match[1];
    const number = Number.parseInt(match[2], 10);
    const status = match[3].trim();

    entries.push({
      phase,
      number,
      status,
      normalizedStatus: normalizeStatus(status),
    });
  }

  return entries.sort((left, right) => {
    if (phaseSortKey(left.phase) !== phaseSortKey(right.phase)) {
      return phaseSortKey(left.phase) - phaseSortKey(right.phase);
    }

    return left.number - right.number;
  });
}

function parsePhaseTasks(programDir) {
  const files = readdirSync(programDir)
    .filter(name => /^F\d+\.html$/.test(name))
    .sort((left, right) => phaseSortKey(left.replace(".html", "")) - phaseSortKey(right.replace(".html", "")));

  const tasks = [];

  for (const fileName of files) {
    const phase = fileName.replace(".html", "");
    const html = readFileSync(path.join(programDir, fileName), "utf8");
    const sections = [];
    const sectionMatcher = /<span class="section-number">(S\d+)<\/span>\s*<span class="section-title">([\s\S]*?)<\/span>/g;

    for (const match of html.matchAll(sectionMatcher)) {
      sections.push({
        position: match.index ?? 0,
        sectionNumber: match[1],
        sectionTitle: decodeHtml(match[2]),
      });
    }

    const taskMatcher =
      /toggleTask\('((F\d+)-S(\d+)-I(\d+))', this\)[\s\S]*?<div class="task-text">([\s\S]*?)<\/div>/g;

    for (const match of html.matchAll(taskMatcher)) {
      const taskPosition = match.index ?? 0;
      let currentSection = sections[0];

      for (const section of sections) {
        if (section.position > taskPosition) {
          break;
        }

        currentSection = section;
      }

      const taskIndex = Number.parseInt(match[4], 10);
      const backlogNumber = getPhaseStartNumber(phase) + taskIndex;

      tasks.push({
        phase,
        backlogNumber,
        taskId: match[1],
        sectionNumber: currentSection?.sectionNumber ?? `S${match[3].padStart(2, "0")}`,
        sectionTitle: currentSection?.sectionTitle ?? "Unknown section",
        text: decodeHtml(match[5]),
      });
    }
  }

  return tasks;
}

function renderBatch(batch, pendingTotal, requestedCount) {
  const generatedAt = new Date().toISOString();
  const first = batch[0];
  const last = batch[batch.length - 1];
  const sectionOrder = [];
  const sectionMap = new Map();

  for (const entry of batch) {
    const key = `${entry.phase}:${entry.task.sectionNumber}`;

    if (!sectionMap.has(key)) {
      sectionMap.set(key, {
        phase: entry.phase,
        sectionNumber: entry.task.sectionNumber,
        sectionTitle: entry.task.sectionTitle,
        items: [],
      });
      sectionOrder.push(key);
    }

    sectionMap.get(key).items.push(entry);
  }

  const lines = [
    "# Next Logical Batch",
    "",
    `Generated at: ${generatedAt}`,
    "",
    "## Summary",
    `- Requested item count: ${requestedCount}`,
    `- Materialized item count: ${batch.length}`,
    `- Pending backlog at generation time: ${pendingTotal}`,
    `- First backlog id: ${first.phase}-${first.number}`,
    `- Last backlog id: ${last.phase}-${last.number}`,
    `- Source prompt: PROMPT_GERAL_PENDENCIAS.md`,
    `- Source program set: docs/programs/12-ciclos/F*.html`,
    "",
    "## Execution Order",
  ];

  for (const key of sectionOrder) {
    const section = sectionMap.get(key);
    lines.push(`- ${section.phase} ${section.sectionNumber} | ${section.sectionTitle} | ${section.items.length} itens`);
  }

  for (const key of sectionOrder) {
    const section = sectionMap.get(key);
    lines.push("");
    lines.push(`## ${section.phase} ${section.sectionNumber} - ${section.sectionTitle}`);

    for (const entry of section.items) {
      lines.push(`- ${entry.phase}-${entry.number} | ${entry.task.taskId} | ${entry.status} | ${entry.task.text}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const count = Number.isInteger(args.count) && args.count > 0 ? args.count : DEFAULT_COUNT;
  const outputPath = path.resolve(PROJECT_ROOT, args.output ?? `audit/next-${count}-logical-batch.md`);
  const promptPath = path.join(PROJECT_ROOT, "PROMPT_GERAL_PENDENCIAS.md");
  const programDir = path.join(PROJECT_ROOT, "docs", "programs", "12-ciclos");

  const backlog = parseBacklog(promptPath);
  const tasks = parsePhaseTasks(programDir);
  const taskByBacklogId = new Map(tasks.map(task => [`${task.phase}-${task.backlogNumber}`, task]));
  const pending = backlog.filter(entry => entry.normalizedStatus !== "done");
  const batch = pending.slice(0, count).map(entry => {
    const task = taskByBacklogId.get(`${entry.phase}-${entry.number}`);

    if (!task) {
      throw new Error(`Missing task mapping for backlog item ${entry.phase}-${entry.number}`);
    }

    return {
      ...entry,
      task,
    };
  });

  const markdown = renderBatch(batch, pending.length, count);
  writeFileSync(outputPath, markdown, "utf8");
  console.log(`Materialized ${batch.length} items to ${path.relative(PROJECT_ROOT, outputPath)}`);
}

main();
