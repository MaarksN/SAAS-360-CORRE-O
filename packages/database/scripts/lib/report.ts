import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { artifactsRoot } from "./paths.js";

export async function writeJsonReport<T>(relativePath: string, payload: T): Promise<string> {
  const outputPath = resolve(artifactsRoot, relativePath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload, null, 2), "utf8");
  return outputPath;
}

export async function writeTextReport(relativePath: string, content: string): Promise<string> {
  const outputPath = resolve(artifactsRoot, relativePath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, "utf8");
  return outputPath;
}
