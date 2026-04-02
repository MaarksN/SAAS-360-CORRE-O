#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const nextDir = path.join(root, "apps", "web", ".next");
const manifestPath = path.join(nextDir, "build-manifest.json");
const chunksDir = path.join(nextDir, "static", "chunks");
const outputDir = path.join(root, "artifacts", "quality", "bundle");
const outputJsonPath = path.join(outputDir, "web-bundle-baseline.json");
const outputMdPath = path.join(outputDir, "web-bundle-baseline.md");

function walkFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(abs));
      continue;
    }
    if (entry.isFile()) {
      files.push(abs);
    }
  }
  return files;
}

if (!existsSync(manifestPath)) {
  throw new Error("apps/web/.next/build-manifest.json not found. Run web build first.");
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const chunkFiles = walkFiles(chunksDir);
const chunkStats = chunkFiles
  .map((file) => ({
    file: path.relative(root, file).replaceAll("\\", "/"),
    bytes: statSync(file).size
  }))
  .sort((a, b) => b.bytes - a.bytes);

const totalBytes = chunkStats.reduce((sum, row) => sum + row.bytes, 0);
const top10 = chunkStats.slice(0, 10);

const pages = Object.entries(manifest.pages ?? {}).map(([page, assets]) => ({
  page,
  assetsCount: Array.isArray(assets) ? assets.length : 0,
  assets: Array.isArray(assets) ? assets : []
}));

const report = {
  generatedAt: new Date().toISOString(),
  nextBuildDir: path.relative(root, nextDir).replaceAll("\\", "/"),
  chunks: {
    files: chunkStats.length,
    totalBytes,
    totalKiB: Number((totalBytes / 1024).toFixed(2)),
    top10
  },
  pages
};

const markdown = [
  "# Web Bundle Baseline",
  "",
  `- generatedAt: ${report.generatedAt}`,
  `- nextBuildDir: ${report.nextBuildDir}`,
  `- chunk files: ${report.chunks.files}`,
  `- total size: ${report.chunks.totalBytes} bytes (${report.chunks.totalKiB} KiB)`,
  "",
  "## Top 10 Chunks",
  "",
  "| File | Bytes | KiB |",
  "| --- | ---: | ---: |"
];

for (const row of top10) {
  markdown.push(`| ${row.file} | ${row.bytes} | ${(row.bytes / 1024).toFixed(2)} |`);
}

markdown.push("", "## Pages in build-manifest", "", "| Page | Assets |", "| --- | ---: |");
for (const page of pages) {
  markdown.push(`| ${page.page} | ${page.assetsCount} |`);
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(outputMdPath, `${markdown.join("\n")}\n`, "utf8");
console.log(path.relative(root, outputJsonPath));
