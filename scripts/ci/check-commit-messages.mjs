#!/usr/bin/env node
import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { projectRoot, resolvePnpmInvocation } from "./shared.mjs";

const allowlistPath = path.join(projectRoot, ".github", "commit-message-allowlist.txt");
const extraAllowedPatterns = [
  /^Merge .+/,
  /^Revert ".+"/,
  /^Update scripts\/release\/verify-cycle0-flow\.sh$/
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

function ensureCommitlintAvailable(invocation) {
  const result = spawnSync(
    invocation.command,
    [...invocation.argsPrefix, "exec", "commitlint", "--version"],
    {
      cwd: projectRoot,
      encoding: "utf8",
      env: invocation.env,
      stdio: "pipe"
    }
  );

  if ((result.status ?? 1) !== 0) {
    const details = (result.stderr || result.stdout || "unknown error").trim();
    throw new Error(`commitlint is unavailable: ${details}`);
  }
}

function hasRef(ref) {
  return Boolean(gitCapture(["rev-parse", "--verify", ref], true));
}

function resolveBaseRef() {
  const explicitBase = process.env.COMMIT_CHECK_BASE?.trim();
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

function loadAllowlist() {
  if (!existsSync(allowlistPath)) {
    return new Set();
  }

  return new Set(
    readFileSync(allowlistPath, "utf8")
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.split(/\s+/u)[0])
  );
}

function listCommitSubjects(baseRef) {
  const output = baseRef
    ? gitCapture(["log", "--format=%H%x09%s", `${baseRef}..HEAD`], true)
    : gitCapture(["log", "--format=%H%x09%s", "-1", "HEAD"], true);

  if (!output) {
    return [];
  }

  return output
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [sha = "", subject = ""] = line.split("\t");
      return { sha, subject };
    });
}

function lintSubject(invocation, subject) {
  return spawnSync(
    invocation.command,
    [...invocation.argsPrefix, "exec", "commitlint", "--config", "commitlint.config.cjs"],
    {
      cwd: projectRoot,
      encoding: "utf8",
      env: invocation.env,
      input: `${subject}\n`,
      stdio: "pipe"
    }
  );
}

try {
  const pnpmInvocation = resolvePnpmInvocation();
  ensureCommitlintAvailable(pnpmInvocation);

  const allowlist = loadAllowlist();
  const baseRef = resolveBaseRef();
  const commits = listCommitSubjects(baseRef);
  const invalidCommits = [];

  for (const commit of commits) {
    if (allowlist.has(commit.sha)) {
      continue;
    }

    if (extraAllowedPatterns.some((pattern) => pattern.test(commit.subject))) {
      continue;
    }

    const result = lintSubject(pnpmInvocation, commit.subject);
    if ((result.status ?? 1) === 0) {
      continue;
    }

    invalidCommits.push({
      ...commit,
      output: (result.stderr || result.stdout || "commitlint validation failed").trim()
    });
  }

  if (invalidCommits.length > 0) {
    console.error("[commit-check] FAILED");
    for (const invalidCommit of invalidCommits) {
      console.error(`- ${invalidCommit.sha.slice(0, 7)} ${invalidCommit.subject}`);
      for (const line of invalidCommit.output.split(/\r?\n/u).filter(Boolean)) {
        console.error(`  ${line}`);
      }
    }
    console.error(
      `Add only temporary legacy exceptions to ${path.relative(projectRoot, allowlistPath).replaceAll("\\", "/")}.`
    );
    process.exitCode = 1;
  } else {
    console.log(
      `[commit-check] ok (${commits.length} commit${commits.length === 1 ? "" : "s"} validated${baseRef ? ` against ${baseRef}` : ""})`
    );
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[commit-check] FAILED: ${message}`);
  process.exitCode = 1;
}
