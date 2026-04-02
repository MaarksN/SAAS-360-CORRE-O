#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { projectRoot } from "./shared.mjs";

const lintScriptViolations = [];
const workflowViolations = [];
const ignoredDirectories = new Set([".git", ".next", ".nuxt", ".turbo", "dist", "node_modules"]);

function walkPackageJsonFiles(startRelativePath) {
  const absoluteStart = path.join(projectRoot, startRelativePath);
  const queue = [absoluteStart];
  const files = [];

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) continue;

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) {
          queue.push(path.join(current, entry.name));
        }
        continue;
      }

      if (entry.name === "package.json") {
        files.push(path.join(current, entry.name));
      }
    }
  }

  return files;
}

function hasLintFix(command) {
  return /\blint\b/i.test(command) && /\s--fix(?:\s|$|=)/i.test(command);
}

for (const packageJsonPath of walkPackageJsonFiles(".")) {
  const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const scripts = parsed.scripts ?? {};

  for (const [name, command] of Object.entries(scripts)) {
    if (!/^lint(?::|$)/.test(name)) {
      continue;
    }

    if (typeof command !== "string") {
      continue;
    }

    if (/\s--fix(?:\s|$|=)/i.test(command)) {
      lintScriptViolations.push({
        command,
        path: path.relative(projectRoot, packageJsonPath).replaceAll("\\", "/"),
        script: name
      });
    }
  }
}

const workflowsRoot = path.join(projectRoot, ".github", "workflows");
for (const entry of readdirSync(workflowsRoot, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  if (!entry.name.endsWith(".yml") && !entry.name.endsWith(".yaml")) continue;

  const workflowPath = path.join(workflowsRoot, entry.name);
  const lines = readFileSync(workflowPath, "utf8").split(/\r?\n/u);

  for (const [index, line] of lines.entries()) {
    if (!hasLintFix(line)) {
      continue;
    }

    workflowViolations.push({
      line: index + 1,
      path: path.relative(projectRoot, workflowPath).replaceAll("\\", "/"),
      text: line.trim()
    });
  }
}

if (lintScriptViolations.length > 0 || workflowViolations.length > 0) {
  console.error("[lint-policy] FAILED: auto-fix is forbidden in CI lint lanes.");

  for (const violation of lintScriptViolations) {
    console.error(`- ${violation.path} -> scripts.${violation.script}: ${violation.command}`);
  }

  for (const violation of workflowViolations) {
    console.error(`- ${violation.path}:${violation.line} -> ${violation.text}`);
  }

  process.exitCode = 1;
} else {
  console.log("[lint-policy] OK: no lint script or workflow uses --fix.");
}
