#!/usr/bin/env node
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import ts from "typescript";

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, "artifacts", "quality", "complexity");
const outputJsonPath = path.join(outputDir, "cyclomatic-baseline.json");
const outputMdPath = path.join(outputDir, "cyclomatic-baseline.md");

const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

function runGitLsFiles() {
  const raw = execSync("git ls-files", {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();

  if (!raw) {
    return [];
  }

  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function shouldScan(filePath) {
  if (!/^(apps|packages|agents)\//.test(filePath)) {
    return false;
  }

  if (/(^|\/)(dist|build|coverage|artifacts|node_modules|test-results)\//.test(filePath)) {
    return false;
  }

  return extensions.has(path.extname(filePath).toLowerCase());
}

function moduleKey(filePath) {
  const parts = filePath.split("/");
  if (parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`;
  }
  return parts[0];
}

function displayName(node) {
  if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) && node.name) {
    return node.name.getText();
  }

  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    const parent = node.parent;
    if (ts.isVariableDeclaration(parent) && parent.name) {
      return parent.name.getText();
    }
    if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
      return parent.name.getText();
    }
  }

  return "<anonymous>";
}

function cyclomatic(node) {
  let complexity = 1;

  function visit(child) {
    if (
      ts.isIfStatement(child) ||
      ts.isForStatement(child) ||
      ts.isForInStatement(child) ||
      ts.isForOfStatement(child) ||
      ts.isWhileStatement(child) ||
      ts.isDoStatement(child) ||
      ts.isConditionalExpression(child) ||
      ts.isCatchClause(child)
    ) {
      complexity += 1;
    }

    if (ts.isCaseClause(child) && child.expression) {
      complexity += 1;
    }

    if (
      ts.isBinaryExpression(child) &&
      [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(
        child.operatorToken.kind
      )
    ) {
      complexity += 1;
    }

    ts.forEachChild(child, visit);
  }

  if (node.body) {
    ts.forEachChild(node.body, visit);
  }

  return complexity;
}

function quantile(values, q) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * q));
  return sorted[idx];
}

function analyzeFile(relPath) {
  const absPath = path.join(projectRoot, relPath);
  const sourceText = readFileSync(absPath, "utf8");
  const sourceFile = ts.createSourceFile(absPath, sourceText, ts.ScriptTarget.Latest, true);
  const rows = [];

  function walk(node) {
    if (
      (ts.isFunctionDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isArrowFunction(node) ||
        ts.isMethodDeclaration(node)) &&
      node.body
    ) {
      const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      rows.push({
        file: relPath,
        function: displayName(node),
        line: start.line + 1,
        complexity: cyclomatic(node)
      });
    }

    ts.forEachChild(node, walk);
  }

  walk(sourceFile);
  return rows;
}

const files = runGitLsFiles().filter(shouldScan);
const findings = files.flatMap((file) => analyzeFile(file));
const byModule = new Map();

for (const finding of findings) {
  const key = moduleKey(finding.file);
  if (!byModule.has(key)) {
    byModule.set(key, []);
  }
  byModule.get(key).push(finding);
}

const modules = [...byModule.entries()]
  .map(([module, rows]) => {
    const values = rows.map((row) => row.complexity);
    const max = Math.max(...values);
    const avg = Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
    const p95 = quantile(values, 0.95);
    const high = rows.filter((row) => row.complexity >= 20).sort((a, b) => b.complexity - a.complexity).slice(0, 10);

    return {
      module,
      functions: rows.length,
      avgComplexity: avg,
      p95Complexity: p95,
      maxComplexity: max,
      functionsAtOrAbove20: rows.filter((row) => row.complexity >= 20).length,
      hotspots: high
    };
  })
  .sort((a, b) => b.maxComplexity - a.maxComplexity || b.p95Complexity - a.p95Complexity || a.module.localeCompare(b.module));

const topHotspots = findings
  .filter((row) => row.complexity >= 20)
  .sort((a, b) => b.complexity - a.complexity || a.file.localeCompare(b.file))
  .slice(0, 25);

const report = {
  generatedAt: new Date().toISOString(),
  filesScanned: files.length,
  functionsScanned: findings.length,
  modules
};

const markdown = [
  "# Cyclomatic Complexity Baseline",
  "",
  `- generatedAt: ${report.generatedAt}`,
  `- filesScanned: ${report.filesScanned}`,
  `- functionsScanned: ${report.functionsScanned}`,
  "",
  "## Modules",
  "",
  "| Module | Functions | Avg | P95 | Max | >=20 |",
  "| --- | ---: | ---: | ---: | ---: | ---: |"
];

for (const module of modules) {
  markdown.push(
    `| ${module.module} | ${module.functions} | ${module.avgComplexity.toFixed(2)} | ${module.p95Complexity} | ${module.maxComplexity} | ${module.functionsAtOrAbove20} |`
  );
}

markdown.push("", "## Top Hotspots (complexity >= 20)", "");

if (topHotspots.length === 0) {
  markdown.push("- none");
} else {
  for (const hotspot of topHotspots) {
    markdown.push(
      `- ${hotspot.file}:${hotspot.line} ${hotspot.function} (complexity=${hotspot.complexity})`
    );
  }
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(outputMdPath, `${markdown.join("\n")}\n`, "utf8");

console.log(path.relative(projectRoot, outputJsonPath));
