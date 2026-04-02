#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const lockfilePath = path.join(projectRoot, "pnpm-lock.yaml");
const lockfileHashPath = path.join(projectRoot, ".github", "lockfile", "pnpm-lock.sha256");

if (!existsSync(lockfilePath)) {
  console.error("[lockfile-hash] pnpm-lock.yaml was not found.");
  process.exit(1);
}

const lockfileContent = readFileSync(lockfilePath, "utf8");
const hash = createHash("sha256").update(lockfileContent, "utf8").digest("hex");

mkdirSync(path.dirname(lockfileHashPath), { recursive: true });
writeFileSync(lockfileHashPath, `${hash}\n`, "utf8");

console.log(`[lockfile-hash] updated .github/lockfile/pnpm-lock.sha256 (${hash})`);
