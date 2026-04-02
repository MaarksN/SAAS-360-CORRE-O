#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");

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

const manifestFiles = [];

function collectManifestFiles(currentPath) {
  const stat = fs.statSync(currentPath);
  if (!stat.isDirectory()) {
    return;
  }

  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) {
      continue;
    }

    const entryPath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      collectManifestFiles(entryPath);
      continue;
    }

    if (entry.name === "package.json" || entry.name === "pyproject.toml") {
      manifestFiles.push(entryPath);
    }
  }
}

function getManifestMeta(filePath) {
  if (path.basename(filePath) === "package.json") {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      name: data.name ?? path.basename(path.dirname(filePath)),
      version: data.version ?? "0.1.0"
    };
  }

  const content = fs.readFileSync(filePath, "utf8");
  const name = content.match(/^name\s*=\s*["'](.+?)["']/m)?.[1] ?? path.basename(path.dirname(filePath));
  return {
    name,
    version: "0.1.0"
  };
}

collectManifestFiles(repoRoot);

let createdCount = 0;
for (const manifestFile of manifestFiles) {
  const manifestDir = path.dirname(manifestFile);
  const changelogPath = path.join(manifestDir, "CHANGELOG.md");

  if (fs.existsSync(changelogPath)) {
    continue;
  }

  const meta = getManifestMeta(manifestFile);
  const contents = [
    "# Changelog",
    "",
    `All notable changes to \`${meta.name}\` will be documented in this file.`,
    "",
    "The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),",
    "and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).",
    "",
    "## [Unreleased]",
    "",
    "### Added",
    "- Initial changelog scaffold created during the F10 documentation hardening pass.",
    "",
    `## [${meta.version}] - 2026-03-20`,
    "",
    "### Added",
    "- Baseline entry registered for canonical release readiness."
  ];

  fs.writeFileSync(changelogPath, `${contents.join("\n")}
`);
  createdCount += 1;
}

console.log(`Created ${createdCount} changelog files.`);
