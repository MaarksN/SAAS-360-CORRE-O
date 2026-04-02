#!/usr/bin/env node
import { execSync } from "node:child_process";
import { lstatSync, rmSync } from "node:fs";
import path from "node:path";

import { projectRoot } from "./shared.mjs";

const apply = process.argv.includes("--apply");
const daysArgument = process.argv.find((arg) => arg.startsWith("--days="));
const retentionDays = Number.parseInt(daysArgument?.split("=")[1] ?? "90", 10);
const cutoffTimestamp = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

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

const untrackedEntries = gitCapture(["ls-files", "--others", "--exclude-standard", "--", "artifacts"], true)
  .split(/\r?\n/u)
  .map((line) => line.trim())
  .filter(Boolean);

const staleEntries = [];

for (const relativeEntry of untrackedEntries) {
  const absoluteEntry = path.join(projectRoot, relativeEntry);
  const stats = lstatSync(absoluteEntry);

  if (stats.mtimeMs < cutoffTimestamp) {
    staleEntries.push(relativeEntry.replaceAll("\\", "/"));
    if (apply) {
      rmSync(absoluteEntry, { force: true, recursive: true });
    }
  }
}

if (staleEntries.length === 0) {
  console.log(`[artifacts-cleanup] ok (no stale untracked artifacts older than ${retentionDays} days)`);
} else {
  console.log(
    `[artifacts-cleanup] ${apply ? "removed" : "found"} ${staleEntries.length} stale untracked artifact${staleEntries.length === 1 ? "" : "s"}`
  );
  for (const entry of staleEntries) {
    console.log(`- ${entry}`);
  }
}
