#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolvePnpmInvocation } from "./shared.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const workflowDirectory = path.join(projectRoot, ".github", "workflows");
const lockfilePath = path.join(projectRoot, "pnpm-lock.yaml");
const lockfileHashPath = path.join(projectRoot, ".github", "lockfile", "pnpm-lock.sha256");
const gitlabConfigPath = path.join(projectRoot, ".gitlab-ci.yml");
const protectedBaseBranches = new Set(["main", "develop"]);
const requiredSecurityLabel = (process.env.LOCKFILE_SECURITY_LABEL || "security-approved").trim().toLowerCase();

function toRepoPath(absolutePath) {
  return path.relative(projectRoot, absolutePath).replace(/\\/g, "/");
}

function readText(absolutePath) {
  return readFileSync(absolutePath, "utf8");
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function gitCapture(args, allowFailure = false) {
  try {
    return execFileSync("git", args, {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    }).trim();
  } catch (error) {
    if (allowFailure) {
      return "";
    }

    const stderr = error?.stderr?.toString().trim();
    throw new Error(stderr || `git ${args.join(" ")} failed`);
  }
}

function hasRef(ref) {
  return Boolean(gitCapture(["rev-parse", "--verify", ref], true));
}

function resolveBaseRef() {
  const githubBaseRef = process.env.GITHUB_BASE_REF?.trim();
  if (githubBaseRef) {
    gitCapture(["fetch", "--no-tags", "--depth=1", "origin", githubBaseRef], true);
    const remoteRef = `origin/${githubBaseRef}`;
    if (hasRef(remoteRef)) {
      return remoteRef;
    }
  }

  return hasRef("HEAD~1") ? "HEAD~1" : null;
}

function listChangedFiles(baseRef) {
  if (!baseRef) {
    return [];
  }

  const changed = gitCapture(["diff", "--name-only", "--diff-filter=ACMR", `${baseRef}...HEAD`, "--"], true);
  return changed
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replaceAll("\\", "/"));
}

function listWorkflowFiles() {
  if (!existsSync(workflowDirectory)) {
    return [];
  }

  return readdirSync(workflowDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.ya?ml$/iu.test(entry.name))
    .map((entry) => path.join(workflowDirectory, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

function runPnpm(args) {
  const invocation = resolvePnpmInvocation();

  execFileSync(invocation.command, [...invocation.argsPrefix, ...args], {
    cwd: projectRoot,
    encoding: "utf8",
    env: invocation.env,
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function countLeadingSpaces(value) {
  const match = value.match(/^\s*/u);
  return match ? match[0].length : 0;
}

function findStepStart(lines, fromIndex, startIndent) {
  for (let index = fromIndex; index >= 0; index -= 1) {
    const line = lines[index];
    if (/^\s*-\s+/u.test(line) && countLeadingSpaces(line) <= startIndent) {
      return index;
    }
  }

  return -1;
}

function findStepEnd(lines, fromIndex, stepIndent) {
  for (let index = fromIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\s*-\s+/u.test(line) && countLeadingSpaces(line) === stepIndent) {
      return index;
    }
  }

  return lines.length;
}

function validateWorkflowInstallCommands(workflowPath, workflowContent, issues) {
  const lines = workflowContent.split(/\r?\n/u);

  lines.forEach((line, index) => {
    const isInlineRunInstall = /^\s*run:\s*pnpm\s+install\b/u.test(line);
    const isShellInstall = /^\s*pnpm\s+install\b/u.test(line);

    if (!isInlineRunInstall && !isShellInstall) {
      return;
    }

    if (!/--frozen-lockfile\b/u.test(line)) {
      issues.push(
        `${toRepoPath(workflowPath)}:${index + 1} installs dependencies without --frozen-lockfile.`
      );
    }
  });
}

function validateWorkflowCacheConfig(workflowPath, workflowContent, issues) {
  const lines = workflowContent.split(/\r?\n/u);

  lines.forEach((line, index) => {
    if (!/uses:\s*actions\/setup-node@/u.test(line)) {
      return;
    }

    const setupIndent = countLeadingSpaces(line);
    const stepStart = findStepStart(lines, index, setupIndent);
    if (stepStart < 0) {
      issues.push(`${toRepoPath(workflowPath)}:${index + 1} could not resolve setup-node step boundary.`);
      return;
    }

    const stepIndent = countLeadingSpaces(lines[stepStart]);
    const stepEnd = findStepEnd(lines, index, stepIndent);
    const stepBlock = lines.slice(stepStart, stepEnd).join("\n");

    if (!/cache:\s*pnpm\b/u.test(stepBlock)) {
      issues.push(
        `${toRepoPath(workflowPath)}:${index + 1} setup-node must enable pnpm cache (cache: pnpm).`
      );
    }

    if (!/cache-dependency-path:\s*pnpm-lock\.yaml\b/u.test(stepBlock)) {
      issues.push(
        `${toRepoPath(workflowPath)}:${index + 1} setup-node must set cache-dependency-path: pnpm-lock.yaml.`
      );
    }
  });
}

function validateGitLabConfig(issues) {
  if (!existsSync(gitlabConfigPath)) {
    return;
  }

  const content = readText(gitlabConfigPath);
  const lines = content.split(/\r?\n/u);

  lines.forEach((line, index) => {
    if (/\bpnpm\s+install\b/u.test(line) && !/--frozen-lockfile\b/u.test(line)) {
      issues.push(`.gitlab-ci.yml:${index + 1} installs dependencies without --frozen-lockfile.`);
    }
  });

  if (!/pnpm-lock\.yaml/u.test(content)) {
    issues.push(".gitlab-ci.yml must include pnpm-lock.yaml in cache key/dependency tracking.");
  }
}

function validateLockfileHash(issues) {
  if (!existsSync(lockfilePath)) {
    issues.push("pnpm-lock.yaml is missing.");
    return;
  }

  if (!existsSync(lockfileHashPath)) {
    issues.push(`${toRepoPath(lockfileHashPath)} is missing. Run pnpm lockfile:hash:update.`);
    return;
  }

  const lockfileContent = readText(lockfilePath);
  const expectedHash = readText(lockfileHashPath).trim().split(/\s+/u)[0]?.toLowerCase();

  if (!/^[a-f0-9]{64}$/u.test(expectedHash || "")) {
    issues.push(`${toRepoPath(lockfileHashPath)} must contain a single sha256 hash in lowercase hex.`);
    return;
  }

  const actualHash = sha256(lockfileContent);
  if (actualHash !== expectedHash) {
    issues.push(
      `Lockfile hash mismatch (${actualHash}) != ${toRepoPath(lockfileHashPath)} (${expectedHash}). Run pnpm lockfile:hash:update.`
    );
  }
}

function validateManifestAndLockfileDrift(changedFiles, issues) {
  if (changedFiles.length === 0) {
    return;
  }

  const baseRef = resolveBaseRef();
  const normalizedFiles = new Set(changedFiles);
  const lockfileChanged = normalizedFiles.has("pnpm-lock.yaml");

  function pickLockfileRelevantManifestFields(manifest) {
    return {
      dependencies: manifest?.dependencies ?? {},
      devDependencies: manifest?.devDependencies ?? {},
      optionalDependencies: manifest?.optionalDependencies ?? {},
      packageManager: manifest?.packageManager ?? null,
      peerDependencies: manifest?.peerDependencies ?? {},
      peerDependenciesMeta: manifest?.peerDependenciesMeta ?? {},
      pnpm: manifest?.pnpm ?? {}
    };
  }

  function readManifestFromWorkingTree(relativePath) {
    return JSON.parse(readText(path.join(projectRoot, relativePath)));
  }

  function readManifestFromRef(ref, relativePath) {
    const content = gitCapture(["show", `${ref}:${relativePath}`], true);
    return content ? JSON.parse(content) : null;
  }

  function didLockfileRelevantManifestFieldsChange(relativePath) {
    const currentManifest = pickLockfileRelevantManifestFields(readManifestFromWorkingTree(relativePath));
    const previousManifest = pickLockfileRelevantManifestFields(
      baseRef ? readManifestFromRef(baseRef, relativePath) : readManifestFromRef("HEAD", relativePath)
    );

    return JSON.stringify(currentManifest) !== JSON.stringify(previousManifest);
  }

  const manifestChanged = changedFiles.some((file) => {
    if (file === "pnpm-workspace.yaml") {
      return true;
    }

    if (file === "package.json" || /^(apps|agents|packages)\/[^/]+\/package\.json$/u.test(file)) {
      return didLockfileRelevantManifestFieldsChange(file);
    }

    return false;
  });

  if (manifestChanged && !lockfileChanged) {
    issues.push(
      "Manifest changes detected without pnpm-lock.yaml update. Regenerate and commit the lockfile before merge."
    );
  }
}

function validateSecurityApprovalAlert(changedFiles, issues) {
  const eventName = process.env.GITHUB_EVENT_NAME?.trim();
  const baseRef = process.env.GITHUB_BASE_REF?.trim();

  if (eventName !== "pull_request" || !protectedBaseBranches.has(baseRef || "")) {
    return;
  }

  if (!changedFiles.includes("pnpm-lock.yaml")) {
    return;
  }

  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !existsSync(eventPath)) {
    issues.push(
      "Unable to read pull_request event payload to validate security-approved label for lockfile changes."
    );
    return;
  }

  let payload = null;
  try {
    payload = JSON.parse(readText(eventPath));
  } catch {
    issues.push("Unable to parse GitHub event payload for lockfile security label validation.");
    return;
  }

  const labels = new Set(
    (payload.pull_request?.labels ?? [])
      .map((label) => String(label?.name || "").trim().toLowerCase())
      .filter(Boolean)
  );

  if (!labels.has(requiredSecurityLabel)) {
    issues.push(
      `pnpm-lock.yaml changed in PR to ${baseRef} without '${requiredSecurityLabel}' label. Request security approval before merge.`
    );
  }
}

function validateLockfileRegenerationDiff(issues) {
  if (!existsSync(lockfilePath)) {
    return;
  }

  const originalContent = readText(lockfilePath);

  try {
    runPnpm(["install", "--lockfile-only", "--ignore-scripts"]);
  } catch (error) {
    const stderr = error?.stderr?.toString().trim();
    issues.push(`pnpm install --lockfile-only --ignore-scripts failed: ${stderr || error.message}`);
    writeFileSync(lockfilePath, originalContent, "utf8");
    return;
  }

  const regeneratedContent = readText(lockfilePath);
  writeFileSync(lockfilePath, originalContent, "utf8");

  if (regeneratedContent !== originalContent) {
    issues.push(
      "pnpm-lock.yaml drift detected after lockfile regeneration. Commit the regenerated lockfile before merge."
    );
  }
}

function main() {
  const issues = [];
  const baseRef = resolveBaseRef();
  const changedFiles = listChangedFiles(baseRef);
  const workflowFiles = listWorkflowFiles();

  for (const workflowFile of workflowFiles) {
    const workflowContent = readText(workflowFile);
    validateWorkflowInstallCommands(workflowFile, workflowContent, issues);
    validateWorkflowCacheConfig(workflowFile, workflowContent, issues);
  }

  validateGitLabConfig(issues);
  validateLockfileHash(issues);
  validateManifestAndLockfileDrift(changedFiles, issues);
  validateSecurityApprovalAlert(changedFiles, issues);
  validateLockfileRegenerationDiff(issues);

  if (issues.length > 0) {
    console.error("[lockfile-governance] FAILED");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  const scope = baseRef ? `base=${baseRef}` : "base=n/a";
  console.log(
    `[lockfile-governance] ok (${workflowFiles.length} workflows validated, ${scope}, changed_files=${changedFiles.length})`
  );
}

main();
