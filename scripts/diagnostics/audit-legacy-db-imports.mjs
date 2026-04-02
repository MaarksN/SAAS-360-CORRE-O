#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function utcDateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function runGit(command) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch (error) {
    if (typeof error.stdout === 'string') {
      return error.stdout;
    }

    throw error;
  }
}

function normalizeLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
}

function classifyFindings(lines) {
  const runtime = [];
  const documentation = [];
  const packageMetadata = [];

  for (const line of lines) {
    if (/README\.md|\.md:/i.test(line)) {
      documentation.push(line);
      continue;
    }

    if (/package\.json:/i.test(line)) {
      packageMetadata.push(line);
      continue;
    }

    runtime.push(line);
  }

  return { runtime, documentation, packageMetadata };
}

function formatSection(title, lines) {
  if (lines.length === 0) {
    return `## ${title}\n\nNenhum resultado.\n`;
  }

  return `## ${title}\n\n${lines.map((line) => `- ${line}`).join('\n')}\n`;
}

const dateStamp = utcDateStamp();
const outputDir = join('artifacts', `f2-legacy-${dateStamp}`, 'logs');
mkdirSync(outputDir, { recursive: true });

const grepOutput = runGit("git grep -n '@birthub/db' -- .");
const lines = normalizeLines(grepOutput);
const findings = classifyFindings(lines);

const rawLogPath = join(outputDir, '01b-git-grep-birthub-db.log');
const summaryPath = join(outputDir, '01c-f2-100-git-grep-summary.md');

writeFileSync(rawLogPath, lines.join('\n') + (lines.length ? '\n' : ''), 'utf8');

const summary = [
  '# F2-100 — Varredura `@birthub/db`',
  '',
  `Data (UTC): ${dateStamp}`,
  `Comando: git grep -n '@birthub/db' -- .`,
  `Total de ocorrências: ${lines.length}`,
  `Ocorrências em runtime/código: ${findings.runtime.length}`,
  `Ocorrências em documentação: ${findings.documentation.length}`,
  `Ocorrências em metadata de pacote: ${findings.packageMetadata.length}`,
  '',
  formatSection('Runtime/Código', findings.runtime),
  formatSection('Documentação', findings.documentation),
  formatSection('Metadata de pacote', findings.packageMetadata)
].join('\n');

writeFileSync(summaryPath, summary, 'utf8');

console.log(`F2-100 concluído: ${lines.length} ocorrência(s) registradas.`);
console.log(`Raw log: ${rawLogPath}`);
console.log(`Resumo: ${summaryPath}`);
