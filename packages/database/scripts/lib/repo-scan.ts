import { readdir, readFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

const DEFAULT_EXTENSIONS = new Set([".cjs", ".js", ".mjs", ".sql", ".ts", ".tsx"]);
const IGNORED_SEGMENTS = new Set([
  ".git",
  ".next",
  ".turbo",
  "artifacts",
  "coverage",
  "dist",
  "node_modules",
  "test-results"
]);

export interface RepoTextFile {
  content: string;
  relativePath: string;
}

export async function collectRepoTextFiles(root: string): Promise<RepoTextFile[]> {
  const files: RepoTextFile[] = [];

  async function walk(currentPath: string): Promise<void> {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (IGNORED_SEGMENTS.has(entry.name)) {
        continue;
      }

      const absolutePath = resolve(currentPath, entry.name);

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (!DEFAULT_EXTENSIONS.has(extname(entry.name))) {
        continue;
      }

      files.push({
        content: await readFile(absolutePath, "utf8"),
        relativePath: relative(root, absolutePath)
      });
    }
  }

  await walk(root);
  return files.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}
