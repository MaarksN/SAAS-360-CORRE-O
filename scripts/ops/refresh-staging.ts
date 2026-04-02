import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

function parseFlag(name: string): string | undefined {
  const flag = process.argv.find((item) => item.startsWith(`${name}=`));
  return flag ? flag.slice(name.length + 1) : undefined;
}

function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator <= 0) {
      continue;
    }

    env[line.slice(0, separator).trim()] = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
  }

  return env;
}

async function main(): Promise<void> {
  const envFile = parseFlag("--env-file") ?? resolve(process.cwd(), ".env.vps");
  const backupFile = parseFlag("--backup-file");
  const apply = process.argv.includes("--apply");
  const envOverrides = parseEnvFile(await readFile(envFile, "utf8"));
  const databaseUrl = envOverrides.DIRECT_DATABASE_URL ?? envOverrides.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL or DIRECT_DATABASE_URL must exist in the provided env file.");
  }

  const plan = [
    `1. Restore backup ${backupFile ?? "<required>"} into the staging database defined by ${envFile}.`,
    "2. Apply the safe migration deploy pipeline.",
    "3. Run the staging seed profile with anonymized fixtures.",
    "4. Execute post-migration checks and release smoke."
  ].join("\n");

  if (!apply) {
    console.log(`Staging refresh plan (dry-run)\n${plan}`);
    return;
  }

  if (!backupFile) {
    throw new Error("--backup-file is required when --apply is used.");
  }

  const restore = spawnSync(
    process.platform === "win32" ? "bash" : "bash",
    [resolve(process.cwd(), "scripts", "ops", "restore-postgres.sh"), "--env-file", envFile, "--force", backupFile],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...envOverrides
      },
      stdio: "inherit"
    }
  );

  if ((restore.status ?? 1) !== 0) {
    process.exit(restore.status ?? 1);
  }

  const steps = [
    ["node", ["--import", "tsx", resolve(process.cwd(), "packages", "database", "scripts", "migrate-deploy-safe.ts")]],
    ["node", ["--import", "tsx", resolve(process.cwd(), "packages", "database", "prisma", "seed.ts"), "--profile=staging"]],
    ["node", ["--import", "tsx", resolve(process.cwd(), "packages", "database", "scripts", "post-migration-checklist.ts")]]
  ];

  for (const [command, args] of steps) {
    const result = spawnSync(command, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...envOverrides
      },
      stdio: "inherit"
    });

    if ((result.status ?? 1) !== 0) {
      process.exit(result.status ?? 1);
    }
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
