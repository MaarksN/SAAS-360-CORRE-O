import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "..");
const envPath = path.join(root, ".env");
const stamp = new Date().toISOString().replaceAll(":", "-");
const outputDir = path.join(root, "artifacts", "baseline", stamp);
const outputPath = path.join(outputDir, "web-vitals-baseline.json");
const outputTxtPath = path.join(outputDir, "web-vitals-baseline.txt");

function loadDotEnv(filePath) {
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator <= 0) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function median(values) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Number(((sorted[middle - 1] + sorted[middle]) / 2).toFixed(3));
  }

  return Number(sorted[middle].toFixed(3));
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(url, timeoutMs = 180000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // keep polling until timeout
    }
    await wait(1000);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function run() {
  loadDotEnv(envPath);

  const port = Number(process.env.WEB_PORT ?? "3001");
  const baseUrl = `http://127.0.0.1:${port}`;
  const healthUrl = `${baseUrl}/health`;
  const shouldSpawnWebServer = process.env.SKIP_WEB_SERVER !== "1";
  const devProcess = shouldSpawnWebServer
    ? process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", "corepack pnpm --filter @birthub/web dev"], {
          cwd: root,
          env: {
            ...process.env,
            WEB_PORT: String(port),
            NEXT_PUBLIC_API_URL: baseUrl,
            NEXT_PUBLIC_APP_URL: baseUrl
          },
          stdio: ["ignore", "pipe", "pipe"]
        })
      : spawn("corepack", ["pnpm", "--filter", "@birthub/web", "dev"], {
          cwd: root,
          env: {
            ...process.env,
            WEB_PORT: String(port),
            NEXT_PUBLIC_API_URL: baseUrl,
            NEXT_PUBLIC_APP_URL: baseUrl
          },
          stdio: ["ignore", "pipe", "pipe"]
        })
    : null;

  try {
    await waitForHealth(healthUrl);

    const browser = await chromium.launch({ headless: true });
    const runs = [];
    const routes = ["/", "/pricing"];

    try {
      for (const route of routes) {
        for (let iteration = 0; iteration < 3; iteration += 1) {
          const context = await browser.newContext();
          const page = await context.newPage();

          await page.addInitScript(() => {
            const state = {
              cls: 0,
              fid: null,
              lcp: null
            };

            // Capture final Largest Contentful Paint candidate for the page.
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                state.lcp = entry.startTime;
              }
            }).observe({ buffered: true, type: "largest-contentful-paint" });

            // Accumulate layout shifts that are not user-driven.
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                  state.cls += entry.value;
                }
              }
            }).observe({ buffered: true, type: "layout-shift" });

            // FID requires the first actual user interaction.
            new PerformanceObserver((list) => {
              const first = list.getEntries()[0];
              if (first && state.fid === null) {
                state.fid = first.processingStart - first.startTime;
              }
            }).observe({ buffered: true, type: "first-input" });

            window.__birthubVitals = state;
          });

          await page.goto(`${baseUrl}${route}`, { timeout: 120000, waitUntil: "load" });
          await page.waitForTimeout(3500);
          await page.mouse.click(100, 100);
          await page.waitForTimeout(1200);

          const metrics = await page.evaluate(() => window.__birthubVitals);
          runs.push({
            cls: Number((metrics.cls ?? 0).toFixed(4)),
            fidMs: metrics.fid === null ? null : Number(metrics.fid.toFixed(3)),
            iteration: iteration + 1,
            lcpMs: metrics.lcp === null ? null : Number(metrics.lcp.toFixed(3)),
            route
          });

          await context.close();
        }
      }
    } finally {
      await browser.close();
    }

    const lcpValues = runs.map((runItem) => runItem.lcpMs).filter((value) => value !== null);
    const clsValues = runs.map((runItem) => runItem.cls).filter((value) => value !== null);
    const fidValues = runs.map((runItem) => runItem.fidMs).filter((value) => value !== null);

    const result = {
      generatedAt: new Date().toISOString(),
      notes: {
        fid:
          fidValues.length === 0
            ? "FID unavailable in this lab run; browser did not emit first-input entries."
            : "FID captured via first-input PerformanceObserver."
      },
      routes,
      runs,
      summary: {
        clsMedian: median(clsValues),
        fidMedianMs: median(fidValues),
        lcpMedianMs: median(lcpValues)
      }
    };

    mkdirSync(outputDir, { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    writeFileSync(
      outputTxtPath,
      [
        "# Core Web Vitals Baseline",
        `generatedAt: ${result.generatedAt}`,
        `routes: ${routes.join(", ")}`,
        `LCP median (ms): ${result.summary.lcpMedianMs ?? "n/a"}`,
        `FID median (ms): ${result.summary.fidMedianMs ?? "n/a"}`,
        `CLS median: ${result.summary.clsMedian ?? "n/a"}`,
        `note_fid: ${result.notes.fid}`
      ].join("\n") + "\n",
      "utf8"
    );

    console.log(outputPath);
  } finally {
    if (devProcess && !devProcess.killed) {
      devProcess.kill("SIGTERM");
      await wait(1000);
      if (!devProcess.killed) {
        devProcess.kill("SIGKILL");
      }
    }
  }
}

void run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
