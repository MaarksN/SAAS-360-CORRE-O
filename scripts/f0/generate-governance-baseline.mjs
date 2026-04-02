import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "artifacts", "f0-baseline-2026-03-22", "reports");
mkdirSync(outputDir, { recursive: true });

function shell(command) {
  return execSync(command, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function safeShell(command, fallback = "unavailable") {
  try {
    return shell(command);
  } catch {
    return fallback;
  }
}

function countFiles(dir, matcher) {
  const queue = [path.join(root, dir)];
  let count = 0;

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || !existsSync(current)) {
      continue;
    }

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (["node_modules", ".git", ".next", ".turbo", "dist", "coverage", "test-results"].includes(entry.name)) {
        continue;
      }

      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      if (matcher(fullPath)) {
        count += 1;
      }
    }
  }

  return count;
}

function dirSize(dir) {
  const queue = [path.join(root, dir)];
  let total = 0;

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || !existsSync(current)) {
      continue;
    }

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (["node_modules", ".git", ".next", ".turbo", "dist", "coverage", "test-results"].includes(entry.name)) {
        continue;
      }

      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
      } else {
        total += statSync(fullPath).size;
      }
    }
  }

  return total;
}

function listWorkspacePackages() {
  const packageGlobs = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).workspaces ?? [];
  const packages = [];

  for (const glob of packageGlobs) {
    const [base] = glob.split("/*");
    const baseDir = path.join(root, base);
    if (!existsSync(baseDir)) {
      continue;
    }

    for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }

      const packageJsonPath = path.join(baseDir, entry.name, "package.json");
      if (!existsSync(packageJsonPath)) {
        continue;
      }

      const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
      packages.push({
        name: pkg.name ?? `${base}/${entry.name}`,
        path: path.relative(root, path.join(baseDir, entry.name)).replaceAll("\\", "/"),
        scripts: Object.keys(pkg.scripts ?? {}).length,
        dependencies: Object.keys({
          ...(pkg.dependencies ?? {}),
          ...(pkg.devDependencies ?? {})
        }).length
      });
    }
  }

  return packages.sort((a, b) => a.path.localeCompare(b.path));
}

const report = {
  generatedAt: new Date().toISOString(),
  git: {
    branch: safeShell("git branch --show-current"),
    commit: safeShell("git rev-parse HEAD"),
    shortCommit: safeShell("git rev-parse --short HEAD"),
    tagCandidate: "baseline-f0"
  },
  runtime: {
    node: process.version,
    pnpm: safeShell("corepack pnpm --version"),
    python: safeShell("python3 --version"),
    prisma: safeShell("corepack pnpm --filter @birthub/database exec prisma --version | head -n 1")
  },
  inventory: {
    workspaces: listWorkspacePackages(),
    sourceFileCounts: {
      web: countFiles("apps/web", (file) => /\.(ts|tsx|js|jsx)$/.test(file)),
      api: countFiles("apps/api", (file) => /\.(ts|tsx|js|jsx)$/.test(file)),
      worker: countFiles("apps/worker", (file) => /\.(ts|tsx|js|jsx)$/.test(file)),
      database: countFiles("packages/database", (file) => /\.(ts|tsx|js|jsx|sql|prisma)$/.test(file)),
      agents: countFiles("agents", (file) => /\.(ts|tsx|js|jsx|py)$/.test(file))
    },
    testFileCounts: {
      web: countFiles("apps/web", (file) => /test\.(ts|tsx|js|jsx)$/.test(file)),
      api: countFiles("apps/api", (file) => /test\.(ts|tsx|js|jsx)$/.test(file)),
      worker: countFiles("apps/worker", (file) => /test\.(ts|tsx|js|jsx)$/.test(file)),
      packages: countFiles("packages", (file) => /test\.(ts|tsx|js|jsx)$/.test(file)),
      pythonAgents: countFiles("agents", (file) => /test_.*\.py$/.test(path.basename(file)))
    },
    directorySizeBytes: {
      web: dirSize("apps/web"),
      api: dirSize("apps/api"),
      worker: dirSize("apps/worker"),
      database: dirSize("packages/database"),
      agents: dirSize("agents")
    }
  },
  evidence: {
    requiredLogs: [
      "artifacts/f0-baseline-2026-03-22/logs/01-install-frozen-lockfile.log",
      "artifacts/f0-baseline-2026-03-22/logs/02-monorepo-doctor.log",
      "artifacts/f0-baseline-2026-03-22/logs/03-release-scorecard.log"
    ],
    referenceDocs: [
      "docs/observability-alerts.md",
      "docs/release/final_slo_review.md",
      "docs/security/sast-tools.md",
      "docs/execution/f0-governance-baseline-2026-03-21.md"
    ]
  }
};

writeFileSync(path.join(outputDir, "repo-inventory.json"), `${JSON.stringify(report, null, 2)}\n`);

const markdown = `# F0 Repository Inventory Snapshot (2026-03-22)\n\n- Generated at: ${report.generatedAt}\n- Branch: ${report.git.branch}\n- Commit reference: ${report.git.shortCommit}\n- Node: ${report.runtime.node}\n- pnpm: ${report.runtime.pnpm}\n- Python: ${report.runtime.python}\n\n## Source file counts\n\n| Surface | Files |\n| --- | ---: |\n| Web | ${report.inventory.sourceFileCounts.web} |\n| API | ${report.inventory.sourceFileCounts.api} |\n| Worker | ${report.inventory.sourceFileCounts.worker} |\n| Database | ${report.inventory.sourceFileCounts.database} |\n| Agents | ${report.inventory.sourceFileCounts.agents} |\n\n## Test file counts\n\n| Surface | Files |\n| --- | ---: |\n| Web | ${report.inventory.testFileCounts.web} |\n| API | ${report.inventory.testFileCounts.api} |\n| Worker | ${report.inventory.testFileCounts.worker} |\n| Packages | ${report.inventory.testFileCounts.packages} |\n| Python agents | ${report.inventory.testFileCounts.pythonAgents} |\n`; 

writeFileSync(path.join(outputDir, "repo-inventory.md"), markdown);
