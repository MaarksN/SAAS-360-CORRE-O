import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

import { projectRoot, runPnpm } from "./shared.mjs";

const requireDatabase = process.argv.includes("--require-db") || process.env.CI === "true";

function parseEnvFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (key !== "DATABASE_URL") {
      continue;
    }

    const rawValue = line.slice(separatorIndex + 1).trim();
    return rawValue.replace(/^['\"]|['\"]$/g, "");
  }

  return null;
}

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const candidateFiles = [
    path.join(projectRoot, ".env"),
    path.join(projectRoot, ".env.vps"),
    path.join(projectRoot, ".env.local")
  ];

  for (const candidate of candidateFiles) {
    if (!existsSync(candidate)) {
      continue;
    }

    const value = parseEnvFile(candidate);
    if (value) {
      return value;
    }
  }

  return null;
}

async function canReachDatabase(databaseUrl) {
  let parsed;

  try {
    parsed = new URL(databaseUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    return false;
  }

  const host = parsed.hostname;
  const port = Number(parsed.port || "5432");

  if (!host || !Number.isFinite(port)) {
    return false;
  }

  return await new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const timeoutMs = 2500;

    const finish = (result) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

async function main() {
  const databaseUrl = resolveDatabaseUrl();

  if (databaseUrl) {
    process.env.DATABASE_URL = databaseUrl;
  }

  const databaseReachable = databaseUrl
    ? await canReachDatabase(databaseUrl)
    : false;

  if (databaseUrl && databaseReachable) {
    runPnpm(["db:bootstrap:ci"], {
      env: {
        DATABASE_URL: databaseUrl
      }
    });
  } else if (requireDatabase) {
    if (!databaseUrl) {
      throw new Error("[security-guardrails] DATABASE_URL é obrigatória neste modo (use --require-db apenas em CI/ambiente com banco acessível).");
    }

    throw new Error("[security-guardrails] DATABASE_URL configurada, mas o banco está inacessível no host/porta informados.");
  }

  runPnpm(["workspace:audit"]);
  runPnpm(["--filter", "@birthub/config", "test"]);
  runPnpm(["security:guards"]);
  runPnpm(["--filter", "@birthub/api", "typecheck"]);
  runPnpm(["--filter", "@birthub/api", "test"]);
  runPnpm(["--filter", "@birthub/database", "test"]);
  runPnpm(["--filter", "@birthub/database", "db:check:governance"]);
  runPnpm(["--filter", "@birthub/database", "db:check:fk"]);
  runPnpm(["--filter", "@birthub/database", "db:check:tenancy"]);

  if (databaseUrl && databaseReachable) {
    runPnpm(["--filter", "@birthub/database", "db:check:ri"], {
      env: {
        DATABASE_URL: databaseUrl
      }
    });
  } else {
    console.log("[security-guardrails:local] SKIPPED db:check:ri (DATABASE_URL não configurada ou banco inacessível).");
  }

  console.log("[security-guardrails:local] PASS");
}

void main();
