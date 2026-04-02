#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { projectRoot } from "./shared.mjs";

const markdownLinkPattern = /!?\[[^\]]*]\(([^)]+)\)/gu;
const alwaysCheckedFiles = [
  "README.md",
  "CONTRIBUTING.md",
  "docs/README.md",
  "artifacts/README.md",
  ".github/pull_request_template.md"
];

function gitCapture(args, allowFailure = false) {
  try {
    return execSync(`git ${args.join(" ")}`, {
      cwd: projectRoot,
      encoding: "utf8"
    }).trim();
  } catch (error) {
    if (allowFailure) {
      return "";
    }
    throw error;
  }
}

function hasRef(ref) {
  return Boolean(gitCapture(["rev-parse", "--verify", ref], true));
}

function resolveBaseRef() {
  const explicitBase = process.env.DOC_LINKS_BASE?.trim();
  if (explicitBase && hasRef(explicitBase)) {
    return explicitBase;
  }

  const githubBaseRef = process.env.GITHUB_BASE_REF?.trim();
  if (githubBaseRef) {
    const remoteRef = `origin/${githubBaseRef}`;
    if (hasRef(remoteRef)) {
      return remoteRef;
    }
  }

  return hasRef("HEAD~1") ? "HEAD~1" : null;
}

function listMarkdownFiles() {
  if (process.argv.includes("--all")) {
    const tracked = gitCapture(["ls-files"], true);
    return tracked
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line.endsWith(".md"));
  }

  const baseRef = resolveBaseRef();
  const diffArgs = baseRef
    ? ["diff", "--name-only", "--diff-filter=ACMR", `${baseRef}..HEAD`, "--"]
    : ["diff", "--name-only", "--diff-filter=ACMR", "HEAD", "--"];
  const changed = gitCapture(diffArgs, true)
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.endsWith(".md"));

  return [...new Set([...alwaysCheckedFiles, ...changed])].filter((file) =>
    existsSync(path.join(projectRoot, file))
  );
}

function normalizeLinkTarget(sourceFile, target) {
  const cleanTarget = target.trim().replace(/^<|>$/gu, "");
  const [withoutQuery] = cleanTarget.split("?");
  const [withoutAnchor] = withoutQuery.split("#");

  if (!withoutAnchor) {
    return null;
  }

  if (
    withoutAnchor.startsWith("http://") ||
    withoutAnchor.startsWith("https://") ||
    withoutAnchor.startsWith("mailto:") ||
    withoutAnchor.startsWith("data:")
  ) {
    return null;
  }

  if (withoutAnchor.startsWith("/")) {
    return path.join(projectRoot, withoutAnchor.slice(1));
  }

  return path.resolve(path.dirname(path.join(projectRoot, sourceFile)), withoutAnchor);
}

function linkExists(absoluteTargetPath) {
  if (!absoluteTargetPath) {
    return true;
  }

  if (existsSync(absoluteTargetPath)) {
    return true;
  }

  if (!path.extname(absoluteTargetPath) && existsSync(`${absoluteTargetPath}.md`)) {
    return true;
  }

  return false;
}

const files = listMarkdownFiles();
const issues = [];

for (const file of files) {
  const content = readFileSync(path.join(projectRoot, file), "utf8");

  for (const match of content.matchAll(markdownLinkPattern)) {
    const target = match[1];
    if (!target) {
      continue;
    }

    const absoluteTargetPath = normalizeLinkTarget(file, target);
    if (!linkExists(absoluteTargetPath)) {
      issues.push(`${file} -> ${target}`);
    }
  }
}

if (issues.length > 0) {
  console.error("[doc-links] FAILED");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exitCode = 1;
} else {
  console.log(`[doc-links] ok (${files.length} markdown file${files.length === 1 ? "" : "s"} checked)`);
}
