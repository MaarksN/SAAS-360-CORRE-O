#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");
const reportPath = path.join(repoRoot, "artifacts", "documentation", "link-check-report.md");

const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".turbo",
  "artifacts",
  "coverage",
  "dist",
  "node_modules",
  "test-results"
]);

const scanRoots = ["README.md", "docs"];
const markdownFiles = [];
const brokenLinks = [];
const warnings = [];
const headingCache = new Map();

function slugifyHeading(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[`*_~[\](){}:;'",.?!/\\|+=<>@#$%^&]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractHeadings(filePath) {
  if (headingCache.has(filePath)) {
    return headingCache.get(filePath);
  }

  const headings = new Set();
  const content = fs.readFileSync(filePath, "utf8");
  const matches = content.matchAll(/^#{1,6}\s+(.+)$/gm);

  for (const match of matches) {
    headings.add(slugifyHeading(match[1]));
  }

  headingCache.set(filePath, headings);
  return headings;
}

function collectMarkdownFiles(currentPath) {
  const stat = fs.statSync(currentPath);

  if (stat.isFile()) {
    if (/\.(md|mdx)$/i.test(currentPath)) {
      markdownFiles.push(currentPath);
    }
    return;
  }

  const entries = fs.readdirSync(currentPath, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) {
      continue;
    }

    collectMarkdownFiles(path.join(currentPath, entry.name));
  }
}

function normalizeTarget(target) {
  const trimmed = target.trim().replace(/^<|>$/g, "");
  const withoutTitle = trimmed.match(/^([^"\s]+)(?:\s+".*")?$/);
  return withoutTitle?.[1] ?? trimmed;
}

function resolveTargetPath(sourceFile, target) {
  if (target.startsWith("/")) {
    return path.join(repoRoot, target.slice(1));
  }

  return path.resolve(path.dirname(sourceFile), target);
}

function validateAnchor(sourceFile, targetFile, anchor, rawTarget) {
  if (!anchor) {
    return;
  }

  const extension = path.extname(targetFile).toLowerCase();
  if (extension !== ".md" && extension !== ".mdx") {
    return;
  }

  const headings = extractHeadings(targetFile);
  const normalizedAnchor = slugifyHeading(anchor);

  if (!headings.has(normalizedAnchor)) {
    brokenLinks.push({
      file: sourceFile,
      link: rawTarget,
      reason: `Anchor #${anchor} not found in ${path.relative(repoRoot, targetFile)}`
    });
  }
}

function validateLink(filePath, rawTarget) {
  const target = normalizeTarget(rawTarget);

  if (!target || target.startsWith("mailto:") || target.startsWith("tel:") || target.startsWith("data:")) {
    return;
  }

  if (/^https?:\/\//i.test(target)) {
    return;
  }

  if (/^[A-Za-z]:[\\/]/.test(target)) {
    warnings.push({
      file: filePath,
      link: target,
      reason: "Absolute local path kept as manual-only link"
    });
    return;
  }

  if (target.startsWith("#")) {
    validateAnchor(filePath, filePath, target.slice(1), target);
    return;
  }

  const [rawFileTarget, anchor] = target.split("#");
  let resolvedTarget = resolveTargetPath(filePath, rawFileTarget);

  if (!fs.existsSync(resolvedTarget)) {
    if (fs.existsSync(`${resolvedTarget}.md`)) {
      resolvedTarget = `${resolvedTarget}.md`;
    } else if (fs.existsSync(path.join(resolvedTarget, "README.md"))) {
      resolvedTarget = path.join(resolvedTarget, "README.md");
    } else {
      brokenLinks.push({
        file: filePath,
        link: target,
        reason: `Target not found: ${path.relative(repoRoot, resolvedTarget)}`
      });
      return;
    }
  }

  const stat = fs.statSync(resolvedTarget);
  if (stat.isDirectory()) {
    const readmeTarget = path.join(resolvedTarget, "README.md");
    if (!fs.existsSync(readmeTarget)) {
      brokenLinks.push({
        file: filePath,
        link: target,
        reason: `Directory target missing README.md: ${path.relative(repoRoot, resolvedTarget)}`
      });
      return;
    }
    resolvedTarget = readmeTarget;
  }

  validateAnchor(filePath, resolvedTarget, anchor, target);
}

for (const scanRoot of scanRoots) {
  collectMarkdownFiles(path.join(repoRoot, scanRoot));
}

for (const markdownFile of markdownFiles) {
  const content = fs.readFileSync(markdownFile, "utf8");
  const matches = content.matchAll(/!?\[[^\]]*]\(([^)]+)\)/g);

  for (const match of matches) {
    validateLink(markdownFile, match[1]);
  }
}

fs.mkdirSync(path.dirname(reportPath), { recursive: true });

const reportLines = [
  "# Documentation Link Check",
  "",
  `Files scanned: ${markdownFiles.length}`,
  `Broken links: ${brokenLinks.length}`,
  `Warnings: ${warnings.length}`,
  ""
];

if (brokenLinks.length > 0) {
  reportLines.push("## Broken links", "");
  for (const issue of brokenLinks) {
    reportLines.push(`- \`${path.relative(repoRoot, issue.file)}\` -> \`${issue.link}\` (${issue.reason})`);
  }
  reportLines.push("");
}

if (warnings.length > 0) {
  reportLines.push("## Warnings", "");
  for (const warning of warnings) {
    reportLines.push(`- \`${path.relative(repoRoot, warning.file)}\` -> \`${warning.link}\` (${warning.reason})`);
  }
  reportLines.push("");
}

if (brokenLinks.length === 0) {
  reportLines.push("All repo-relative documentation links resolved successfully.");
}

fs.writeFileSync(reportPath, `${reportLines.join("\n")}\n`);
console.log(reportLines.join("\n"));

if (brokenLinks.length > 0) {
  process.exit(1);
}
