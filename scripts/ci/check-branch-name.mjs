#!/usr/bin/env node
import { execSync } from "node:child_process";

import { projectRoot } from "./shared.mjs";

const allowedBranchPattern =
  /^(main|develop|feat\/[a-z0-9._-]+|fix\/[a-z0-9._-]+|refactor\/[a-z0-9._-]+|chore\/[a-z0-9._-]+|release\/[a-z0-9._-]+|hotfix\/[a-z0-9._-]+|codex\/[a-z0-9._-]+|jules\/[a-z0-9._-]+|dependabot\/[a-z0-9._/-]+)$/;

function resolveBranchName() {
  const fromEnv = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME;
  if (fromEnv) {
    return fromEnv.trim();
  }

  return execSync("git rev-parse --abbrev-ref HEAD", {
    cwd: projectRoot,
    encoding: "utf8"
  }).trim();
}

try {
  const branchName = resolveBranchName();

  if (!allowedBranchPattern.test(branchName)) {
    console.error("[branch-check] FAILED");
    console.error(
      `- Branch "${branchName}" must use one of: feat/, fix/, refactor/, chore/, release/, hotfix/, codex/, jules/, dependabot/, main or develop.`
    );
    process.exitCode = 1;
  } else {
    console.log(`[branch-check] ok (${branchName})`);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[branch-check] FAILED: ${message}`);
  process.exitCode = 1;
}
