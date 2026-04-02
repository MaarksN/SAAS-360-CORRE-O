#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import { buildEnv, projectRoot } from "./shared.mjs";

const trackedFiles = execSync("git ls-files", {
  cwd: projectRoot,
  encoding: "utf8",
  env: buildEnv()
})
  .trim()
  .split(/\r?\n/u)
  .filter(Boolean);

const sourceFiles = trackedFiles.filter((file) => /\.(ts|tsx|mts|cts)$/i.test(file));
const noCheckViolations = [];
const tsIgnoreViolations = [];

function hasJustification(rawTail) {
  const normalized = rawTail.replace(/^[-:]+\s*/u, "").trim();
  return normalized.length >= 12;
}

for (const relativePath of sourceFiles) {
  const absolutePath = path.join(projectRoot, relativePath);
  const content = readFileSync(absolutePath, "utf8");
  const lines = content.split(/\r?\n/u);

  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;
    const noCheckMatch = line.match(/@ts-nocheck\b/u);
    if (noCheckMatch) {
      noCheckViolations.push(`${relativePath.replaceAll("\\", "/")}:${lineNumber}`);
      continue;
    }

    const ignoreMatch = line.match(/@ts-ignore\b(.*)$/u);
    if (!ignoreMatch) {
      continue;
    }

    if (!hasJustification(ignoreMatch[1] ?? "")) {
      tsIgnoreViolations.push(`${relativePath.replaceAll("\\", "/")}:${lineNumber}`);
    }
  }
}

if (noCheckViolations.length > 0 || tsIgnoreViolations.length > 0) {
  console.error("[ts-directives-guard] FAILED");
  if (noCheckViolations.length > 0) {
    console.error("- @ts-nocheck is forbidden:");
    for (const violation of noCheckViolations) {
      console.error(`  - ${violation}`);
    }
  }

  if (tsIgnoreViolations.length > 0) {
    console.error("- @ts-ignore requires inline justification (>=12 chars after directive):");
    for (const violation of tsIgnoreViolations) {
      console.error(`  - ${violation}`);
    }
  }

  process.exitCode = 1;
} else {
  console.log("[ts-directives-guard] OK");
}
