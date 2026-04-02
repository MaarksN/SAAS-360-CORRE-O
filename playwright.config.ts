import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { defineConfig } from "@playwright/test";

const bundledPnpm = resolve(
  process.cwd(),
  ".tools/node-v24.14.0-win-x64/node_modules/corepack/dist/pnpm.js"
);
const globalCorepackPnpm = resolve(dirname(process.execPath), "node_modules/corepack/dist/pnpm.js");
const pnpmCli = existsSync(bundledPnpm)
  ? bundledPnpm
  : existsSync(globalCorepackPnpm)
    ? globalCorepackPnpm
    : null;
const pnpmCommand = pnpmCli ? `node "${pnpmCli}" --filter @birthub/web dev` : "pnpm --filter @birthub/web dev";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "retain-on-failure",
    video: "on",
  },
  webServer: {
    command: pnpmCommand,
    url: "http://127.0.0.1:3001/",
    reuseExistingServer: true,
    env: {
      E2E_AGENT_STUDIO_FIXTURE: "1",
      NEXT_PUBLIC_API_URL: "http://127.0.0.1:3001",
      NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3001",
      NEXT_PUBLIC_ENVIRONMENT: "test",
      WEB_PORT: "3001"
    },
  },
});
