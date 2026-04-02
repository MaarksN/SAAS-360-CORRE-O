#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");
const outputPath = path.join(repoRoot, "docs", "f10", "dependency-graph.md");

const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".turbo",
  "artifacts",
  "coverage",
  "dist",
  "node_modules",
  "test-results"
]);

const manifests = [];
const manifestByName = new Map();

function collectManifests(currentPath) {
  const stat = fs.statSync(currentPath);
  if (!stat.isDirectory()) {
    return;
  }

  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) {
      continue;
    }

    const entryPath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      collectManifests(entryPath);
      continue;
    }

    if (entry.name !== "package.json" && entry.name !== "pyproject.toml") {
      continue;
    }

    if (entry.name === "package.json") {
      const data = JSON.parse(fs.readFileSync(entryPath, "utf8"));
      const dir = path.dirname(entryPath);
      manifests.push({
        kind: "node",
        dir,
        name: data.name ?? path.basename(dir),
        version: data.version ?? "0.0.0",
        group: dir.split(path.sep)[0],
        dependencies: {
          ...data.dependencies,
          ...data.devDependencies,
          ...data.peerDependencies,
          ...data.optionalDependencies
        }
      });
      continue;
    }

    const content = fs.readFileSync(entryPath, "utf8");
    const match = content.match(/^name\s*=\s*["'](.+?)["']/m);
    const dir = path.dirname(entryPath);
    manifests.push({
      kind: "python",
      dir,
      name: match?.[1] ?? path.basename(dir),
      version: "python",
      group: dir.split(path.sep)[0],
      dependencies: {}
    });
  }
}

collectManifests(repoRoot);

for (const manifest of manifests) {
  manifestByName.set(manifest.name, manifest);
}

function sanitizeId(value) {
  return value.replace(/[^A-Za-z0-9_]/g, "_");
}

const edges = [];
for (const manifest of manifests) {
  const internalDeps = Object.keys(manifest.dependencies).filter((dependency) => manifestByName.has(dependency));
  for (const dependency of internalDeps.sort()) {
    edges.push([manifest.name, dependency]);
  }
}

const grouped = {
  apps: manifests.filter((manifest) => manifest.group === "apps").sort((a, b) => a.name.localeCompare(b.name)),
  packages: manifests.filter((manifest) => manifest.group === "packages").sort((a, b) => a.name.localeCompare(b.name)),
  agents: manifests.filter((manifest) => manifest.group === "agents").sort((a, b) => a.name.localeCompare(b.name))
};

const topDependents = [...edges.reduce((map, [from]) => {
  map.set(from, (map.get(from) ?? 0) + 1);
  return map;
}, new Map())]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, 10);

const lines = [
  "# Dependency Graph",
  "",
  "Atualizado automaticamente via `pnpm docs:dependency-graph`.",
  "",
  `- Manifestos analisados: ${manifests.length}`,
  `- Dependencias internas mapeadas: ${edges.length}`,
  "",
  "## Hotspots",
  "",
  "| Pacote | Dependencias internas declaradas |",
  "| --- | --- |"
];

for (const [name, count] of topDependents) {
  lines.push(`| \`${name}\` | ${count} |`);
}

lines.push("", "## Mermaid", "", "```mermaid", "graph TD");

for (const [groupName, items] of Object.entries(grouped)) {
  lines.push(`  subgraph ${groupName}[${groupName}]`);
  for (const item of items) {
    lines.push(`    ${sanitizeId(item.name)}["${item.name}"]`);
  }
  lines.push("  end");
}

for (const [from, to] of edges) {
  lines.push(`  ${sanitizeId(from)} --> ${sanitizeId(to)}`);
}

lines.push(
  "```",
  "",
  "## Legend",
  "",
  "- `apps/*`: superficies de execucao e entrega.",
  "- `packages/*`: contratos, bibliotecas e componentes canonicos.",
  "- `agents/*`: workers e servicos especializados."
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${lines.join("\n")}\n`);
console.log(`Dependency graph written to ${path.relative(repoRoot, outputPath)}`);
