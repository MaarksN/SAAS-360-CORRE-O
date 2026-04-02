#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");
const trackerPath = path.join(repoRoot, "docs", "technical-debt", "tracker.json");
const dashboardPath = path.join(repoRoot, "docs", "technical-debt", "dashboard.md");
const velocityPath = path.join(repoRoot, "docs", "technical-debt", "velocity.md");
const ratioPath = path.join(repoRoot, "docs", "technical-debt", "debt-feature-ratio.md");
const executivePath = path.join(repoRoot, "docs", "technical-debt", "executive-report.md");
const artifactPath = path.join(repoRoot, "artifacts", "documentation", "technical-health-dashboard.md");

const tracker = JSON.parse(fs.readFileSync(trackerPath, "utf8"));

const items = tracker.items;
const groupedByStatus = items.reduce((map, item) => {
  map.set(item.status, (map.get(item.status) ?? 0) + 1);
  return map;
}, new Map());
const groupedByRisk = items.reduce((map, item) => {
  map.set(item.residualRisk, (map.get(item.residualRisk) ?? 0) + 1);
  return map;
}, new Map());
const groupedByDomain = items.reduce((map, item) => {
  map.set(item.domain, (map.get(item.domain) ?? 0) + 1);
  return map;
}, new Map());

const closedItems = items.filter((item) => item.status === "closed");
const openItems = items.filter((item) => item.status !== "closed");

const dashboardLines = [
  "# Technical Health Dashboard",
  "",
  `Sprint atual: \`${tracker.currentSprint}\``,
  "",
  "## Summary",
  "",
  `- Itens monitorados: ${items.length}`,
  `- Itens fechados: ${closedItems.length}`,
  `- Itens abertos: ${openItems.length}`,
  `- Risco residual alto: ${groupedByRisk.get("high") ?? 0}`,
  "",
  "## Status",
  "",
  "| Status | Quantidade |",
  "| --- | --- |"
];

for (const [status, count] of [...groupedByStatus.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  dashboardLines.push(`| \`${status}\` | ${count} |`);
}

dashboardLines.push("", "## Residual risk by domain", "", "| Dominio | Itens |", "| --- | --- |");
for (const [domain, count] of [...groupedByDomain.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
  dashboardLines.push(`| \`${domain}\` | ${count} |`);
}

dashboardLines.push("", "## Tracker snapshot", "", "| ID | Titulo | Dominio | Status | Prioridade | Owner | Risco residual | Evidencia |", "| --- | --- | --- | --- | --- | --- | --- | --- |");
for (const item of items) {
  dashboardLines.push(`| \`${item.id}\` | ${item.title} | \`${item.domain}\` | \`${item.status}\` | \`${item.priority}\` | ${item.owner} | \`${item.residualRisk}\` | ${item.evidence.map((entry) => `\`${entry}\``).join("<br>")} |`);
}

const velocityLines = [
  "# Technical Debt Velocity",
  "",
  "Velocidade de encerramento de divida por sprint, gerada a partir de `tracker.json`.",
  "",
  "| Sprint | Debt opened | Debt closed | Net |",
  "| --- | --- | --- | --- |"
];

for (const sprint of tracker.velocity) {
  velocityLines.push(`| \`${sprint.sprint}\` | ${sprint.opened} | ${sprint.closed} | ${sprint.closed - sprint.opened} |`);
}

const ratioLines = [
  "# Debt-to-Feature Ratio",
  "",
  "Razao de fechamento de tech debt versus entregas de feature por sprint.",
  "",
  "| Sprint | Debt closed | Features closed | Ratio |",
  "| --- | --- | --- | --- |"
];

for (const ratio of tracker.debtFeatureRatio) {
  ratioLines.push(`| \`${ratio.sprint}\` | ${ratio.debtClosed} | ${ratio.featuresClosed} | ${ratio.ratio.toFixed(2)} |`);
}

const highRiskItems = openItems.filter((item) => item.residualRisk === "high");
const executiveLines = [
  "# Executive Technical Health Report",
  "",
  `Resumo mensal consolidado para a lideranca. Referencia: sprint \`${tracker.currentSprint}\`.`,
  "",
  "## Executive summary",
  "",
  `- Debt backlog atual: ${openItems.length} itens ativos.`,
  `- Itens fechados pelo programa F10: ${closedItems.length}.`,
  `- Maior risco remanescente: ${highRiskItems.length === 0 ? "nenhum risco alto ativo" : highRiskItems.map((item) => item.title).join("; ")}.`,
  `- Razao debt-to-feature mais recente: ${tracker.debtFeatureRatio.at(-1)?.ratio.toFixed(2) ?? "0.00"}.`,
  "",
  "## Focus areas",
  "",
  "| Dominio | Risco atual | Acao recomendada |",
  "| --- | --- | --- |"
];

for (const focusArea of tracker.focusAreas) {
  executiveLines.push(`| \`${focusArea.domain}\` | \`${focusArea.risk}\` | ${focusArea.action} |`);
}

for (const output of [dashboardPath, velocityPath, ratioPath, executivePath, artifactPath]) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
}

fs.writeFileSync(dashboardPath, `${dashboardLines.join("\n")}\n`);
fs.writeFileSync(artifactPath, `${dashboardLines.join("\n")}\n`);
fs.writeFileSync(velocityPath, `${velocityLines.join("\n")}
`);
fs.writeFileSync(ratioPath, `${ratioLines.join("\n")}
`);
fs.writeFileSync(executivePath, `${executiveLines.join("\n")}
`);

console.log(`Technical health dashboard written to ${path.relative(repoRoot, artifactPath)}`);
