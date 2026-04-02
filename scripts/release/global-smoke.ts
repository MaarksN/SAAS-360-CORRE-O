import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";

import { createLogger } from "@birthub/logger";
import { buildEnv, resolvePnpmInvocation } from "../ci/shared.mjs";

type SmokeCommand = {
  args: string[];
  cwd: string;
  name: string;
};

const logger = createLogger("release-smoke");

function parseFlag(name: string): string | undefined {
  const flag = process.argv.find((item) => item.startsWith(`${name}=`));
  return flag ? flag.slice(name.length + 1) : undefined;
}

function runCommand(input: SmokeCommand): Promise<{
  code: number;
  durationMs: number;
  name: string;
  output: string;
}> {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const invocation = resolvePnpmInvocation();
    const child = spawn(invocation.command, [...invocation.argsPrefix, ...input.args], {
      cwd: input.cwd,
      env: buildEnv({
        FORCE_COLOR: "0"
      }),
      shell: false
    });

    let output = "";

    child.stdout.on("data", (chunk: Buffer | string) => {
      output += typeof chunk === "string" ? chunk : chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      output += typeof chunk === "string" ? chunk : chunk.toString("utf8");
    });
    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        durationMs: Date.now() - startedAt,
        name: input.name,
        output
      });
    });
  });
}

async function main() {
  const root = process.cwd();
  const outputPath =
    parseFlag("--output") ??
    resolve(root, "artifacts", "release", "smoke-summary.json");
  const commands: SmokeCommand[] = [
    { args: ["lint:core"], cwd: root, name: "lint-core" },
    { args: ["typecheck:core"], cwd: root, name: "typecheck-core" },
    { args: ["test:core"], cwd: root, name: "test-core" },
    { args: ["test:isolation"], cwd: root, name: "test-isolation" },
    { args: ["release:migrate", "--", "--dry-run"], cwd: root, name: "release-migration-dry-run" },
    { args: ["privacy:verify"], cwd: root, name: "privacy-anonymization" },
    { args: ["test:e2e:release"], cwd: root, name: "playwright-release" }
  ];

  const results = [];
  for (const command of commands) {
    results.push(await runCommand(command));
  }

  const report = {
    checkedAt: new Date().toISOString(),
    commands: results.map((result) => ({
      code: result.code,
      durationMs: result.durationMs,
      name: result.name
    })),
    ok: results.every((result) => result.code === 0)
  };

  const humanSummary = [
    `Smoke executed at ${report.checkedAt}`,
    ...results.map(
      (result) =>
        `${result.name}: ${result.code === 0 ? "PASS" : "FAIL"} (${result.durationMs}ms)`
    )
  ].join("\n");

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2), "utf8");
  await writeFile(outputPath.replace(/\.json$/i, ".txt"), humanSummary, "utf8");

  logger.info({ summary: humanSummary }, "Release smoke gate completed");

  if (!report.ok) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  logger.error({ error }, "Release smoke gate failed");
  process.exitCode = 1;
});
