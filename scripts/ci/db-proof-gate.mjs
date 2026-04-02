#!/usr/bin/env node
import { runPnpm } from "./shared.mjs";

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.error(
    "[agent-ci] DATABASE_URL is required because database proof is now a mandatory gate for canonical release validation."
  );
  process.exit(1);
}

runPnpm(["test:db:proof"], {
  env: {
    DATABASE_URL: databaseUrl,
    NODE_ENV: process.env.NODE_ENV ?? "test",
    REQUIRE_DATABASE_PROOF: "1"
  }
});
