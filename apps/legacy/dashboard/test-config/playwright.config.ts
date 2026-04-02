// [SOURCE] BirthHub360 — Remediação Forense.html — GAP-DASH-003
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "../tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:3010",
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: {
    command: "corepack pnpm dev",
    url: "http://127.0.0.1:3010/sales",
    reuseExistingServer: true,
    env: {
      DASHBOARD_USE_STATIC_SNAPSHOT: "true",
      NEXT_PUBLIC_DASHBOARD_USE_STATIC_SNAPSHOT: "true"
    }
  }
});
