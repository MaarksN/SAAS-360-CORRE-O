import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

import { createApp } from "../../apps/api/src/app.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "..");
const envPath = path.join(root, ".env");
const stamp = new Date().toISOString().replaceAll(":", "-");
const outputDir = path.join(root, "artifacts", "baseline", stamp);
const outputPath = path.join(outputDir, "api-latency-baseline.json");
const outputTxtPath = path.join(outputDir, "api-latency-baseline.txt");

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

function percentile(values, p) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return Number(sorted[index].toFixed(3));
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  loadDotEnv(envPath);

  const port = Number(process.env.API_PORT ?? "3000");
  const app = createApp();

  const server = await new Promise((resolve, reject) => {
    const created = app.listen(port, () => resolve(created));
    created.on("error", reject);
  });

  const target = `http://127.0.0.1:${port}/health`;
  const iterations = 250;
  const concurrency = 25;
  const warmup = 20;
  const samples = [];

  try {
    for (let i = 0; i < warmup; i += 1) {
      const response = await fetch(target);
      if (!response.ok) {
        throw new Error(`Warmup failed with HTTP ${response.status}`);
      }
    }

    for (let index = 0; index < iterations; index += concurrency) {
      const batch = Array.from({ length: Math.min(concurrency, iterations - index) }, async () => {
        const startedAt = performance.now();
        const response = await fetch(target);
        const elapsedMs = performance.now() - startedAt;

        if (!response.ok) {
          throw new Error(`Benchmark request failed with HTTP ${response.status}`);
        }

        samples.push(elapsedMs);
      });

      await Promise.all(batch);
      await wait(10);
    }
  } finally {
    await new Promise((resolve) => server.close(() => resolve(undefined)));
  }

  const result = {
    generatedAt: new Date().toISOString(),
    iterations,
    concurrency,
    target,
    p50Ms: percentile(samples, 0.5),
    p95Ms: percentile(samples, 0.95),
    p99Ms: percentile(samples, 0.99),
    minMs: Number(Math.min(...samples).toFixed(3)),
    maxMs: Number(Math.max(...samples).toFixed(3)),
    avgMs: Number((samples.reduce((sum, value) => sum + value, 0) / samples.length).toFixed(3)),
    samples: samples.map((value) => Number(value.toFixed(3)))
  };

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  writeFileSync(
    outputTxtPath,
    [
      "# API Latency Baseline",
      `generatedAt: ${result.generatedAt}`,
      `target: ${target}`,
      `iterations: ${iterations}`,
      `concurrency: ${concurrency}`,
      `p50Ms: ${result.p50Ms}`,
      `p95Ms: ${result.p95Ms}`,
      `p99Ms: ${result.p99Ms}`,
      `avgMs: ${result.avgMs}`,
      `minMs: ${result.minMs}`,
      `maxMs: ${result.maxMs}`
    ].join("\n") + "\n",
    "utf8"
  );

  console.log(outputPath);
}

void run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
