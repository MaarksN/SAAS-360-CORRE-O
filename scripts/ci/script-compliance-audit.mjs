import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { formatNow, projectRoot } from "./shared.mjs";

const requiredScripts = ["lint", "typecheck", "test", "build"];
const workspaceRoots = ["apps", "packages"];
const ignoredDirectoryNames = new Set([
  ".git",
  ".next",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
  "test-results",
]);
const complianceArtifactsDirectory = path.join(
  projectRoot,
  "artifacts",
  "script-compliance",
);
const complianceJsonPath = path.join(
  complianceArtifactsDirectory,
  "workspace-script-compliance.json",
);
const complianceMarkdownPath = path.join(
  complianceArtifactsDirectory,
  "workspace-script-compliance.md",
);
const complianceStatusDocPath = path.join(
  projectRoot,
  "docs",
  "standards",
  "package-script-status.md",
);
const scriptPolicyPath = path.join(
  projectRoot,
  "scripts",
  "ci",
  "script-compliance-policy.json",
);

function walkFiles(rootRelativePath) {
  const rootDirectory = path.join(projectRoot, rootRelativePath);
  if (!existsSync(rootDirectory)) {
    return [];
  }

  const collectedFiles = [];
  const queue = [rootDirectory];

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) {
      continue;
    }

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (!ignoredDirectoryNames.has(entry.name)) {
          queue.push(fullPath);
        }
        continue;
      }

      collectedFiles.push(fullPath);
    }
  }

  return collectedFiles;
}

function toRepoRelativePath(absolutePath) {
  return path.relative(projectRoot, absolutePath).replaceAll("\\", "/");
}

function collectWorkspacePackages() {
  return workspaceRoots
    .flatMap((rootRelativePath) =>
      walkFiles(rootRelativePath).filter(
        (absolutePath) => path.basename(absolutePath) === "package.json",
      ),
    )
    .map((absolutePath) => {
      const packageJson = JSON.parse(readFileSync(absolutePath, "utf8"));
      return {
        directory: toRepoRelativePath(path.dirname(absolutePath)),
        name: packageJson.name ?? toRepoRelativePath(absolutePath),
        relativePath: toRepoRelativePath(absolutePath),
        scripts: packageJson.scripts ?? {},
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function escapeMarkdownCell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function normalizeStatus(status) {
  if (status === "na") {
    return "N/A";
  }

  if (status === "ok") {
    return "ok";
  }

  return "missing";
}

function buildMarkdownReport(report) {
  const lines = [
    "# Package Script Status",
    "",
    `Generated at: ${report.generatedAt}`,
    "",
    `- Workspaces: ${report.summary.totals.workspaces}`,
    `- Script slots ok: ${report.summary.totals.ok}`,
    `- Script slots N/A: ${report.summary.totals.na}`,
    `- Script slots missing: ${report.summary.totals.missing}`,
    "",
    "## Approved N/A criteria",
    "",
  ];

  for (const [criterion, description] of Object.entries(report.criteria)) {
    lines.push(`- ${criterion}: ${description}`);
  }

  lines.push(
    "",
    "## Package matrix",
    "",
    "| Package | Path | Priority | Owner | Deadline | Lint | Typecheck | Test | Build | Notes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  );

  for (const row of report.rows) {
    lines.push(
      [
        "|",
        escapeMarkdownCell(row.name),
        "|",
        escapeMarkdownCell(row.directory),
        "|",
        escapeMarkdownCell(row.priority),
        "|",
        escapeMarkdownCell(row.owner),
        "|",
        escapeMarkdownCell(row.deadline),
        "|",
        escapeMarkdownCell(normalizeStatus(row.scripts.lint?.status)),
        "|",
        escapeMarkdownCell(normalizeStatus(row.scripts.typecheck?.status)),
        "|",
        escapeMarkdownCell(normalizeStatus(row.scripts.test?.status)),
        "|",
        escapeMarkdownCell(normalizeStatus(row.scripts.build?.status)),
        "|",
        escapeMarkdownCell(row.notes || "-"),
        "|",
      ].join(" "),
    );
  }

  lines.push(
    "",
    "## Governance",
    "",
    "Reference process: `docs/standards/package-script-governance.md`.",
    "",
  );

  return `${lines.join("\n")}\n`;
}

function writeReport(report) {
  const markdown = buildMarkdownReport(report);

  mkdirSync(complianceArtifactsDirectory, { recursive: true });
  mkdirSync(path.dirname(complianceStatusDocPath), { recursive: true });

  writeFileSync(complianceJsonPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(complianceMarkdownPath, markdown);
  writeFileSync(complianceStatusDocPath, markdown);
}

function main() {
  if (!existsSync(scriptPolicyPath)) {
    throw new Error("Missing scripts/ci/script-compliance-policy.json");
  }

  const policy = JSON.parse(readFileSync(scriptPolicyPath, "utf8"));
  const criteria = policy.naCriteria ?? {};
  const criteriaKeys = new Set(Object.keys(criteria));
  const defaults = policy.defaults ?? {};
  const rows = [];
  const issues = [];

  for (const workspacePackage of collectWorkspacePackages()) {
    const packagePolicy = policy.packages?.[workspacePackage.name] ?? {};
    const notes = [];
    const scriptStatuses = {};

    for (const scriptName of requiredScripts) {
      const command =
        typeof workspacePackage.scripts[scriptName] === "string"
          ? workspacePackage.scripts[scriptName]
          : null;
      const scriptPolicy = packagePolicy.scripts?.[scriptName] ?? null;
      const usesNaCommand = command ? /N\/A/i.test(command) : false;

      if (!command) {
        issues.push(
          `${workspacePackage.name} (${workspacePackage.relativePath}) is missing required script "${scriptName}".`,
        );
      }

      if (scriptPolicy?.status === "na") {
        if (!command) {
          issues.push(
            `${workspacePackage.name} (${workspacePackage.relativePath}) must keep a visible "${scriptName}" command even when approved as N/A.`,
          );
        } else if (!usesNaCommand) {
          issues.push(
            `${workspacePackage.name} (${workspacePackage.relativePath}) marks "${scriptName}" as N/A in policy but the command does not state N/A.`,
          );
        }

        if (scriptPolicy.criterion && !criteriaKeys.has(scriptPolicy.criterion)) {
          issues.push(
            `${workspacePackage.name} (${workspacePackage.relativePath}) references unknown N/A criterion "${scriptPolicy.criterion}".`,
          );
        }

        if (scriptPolicy.justification) {
          notes.push(`${scriptName}: ${scriptPolicy.justification}`);
        }

        scriptStatuses[scriptName] = {
          command,
          criterion: scriptPolicy.criterion ?? null,
          justification: scriptPolicy.justification ?? null,
          status: "na",
        };
        continue;
      }

      if (usesNaCommand) {
        issues.push(
          `${workspacePackage.name} (${workspacePackage.relativePath}) uses an N/A command for "${scriptName}" without formal approval in script-compliance-policy.json.`,
        );
      }

      scriptStatuses[scriptName] = {
        command,
        criterion: null,
        justification: null,
        status: command ? "ok" : "missing",
      };
    }

    rows.push({
      approvedBy: packagePolicy.approvedBy ?? defaults.approvedBy ?? "Platform Tech Lead",
      approvedOn: packagePolicy.approvedOn ?? defaults.approvedOn ?? null,
      deadline: packagePolicy.deadline ?? defaults.deadline ?? "2026-03-29",
      directory: workspacePackage.directory,
      name: workspacePackage.name,
      notes: notes.join(" | "),
      owner: packagePolicy.owner ?? defaults.owner ?? "Platform Engineering",
      priority: packagePolicy.priority ?? defaults.priority ?? "P2",
      relativePath: workspacePackage.relativePath,
      reviewer: packagePolicy.reviewer ?? defaults.reviewer ?? "Platform Tech Lead",
      risk: packagePolicy.risk ?? defaults.risk ?? "low",
      scripts: scriptStatuses,
    });
  }

  const summary = {
    generatedAt: formatNow(),
    totals: {
      missing: 0,
      na: 0,
      ok: 0,
      workspaces: rows.length,
    },
  };

  for (const row of rows) {
    for (const scriptName of requiredScripts) {
      const status = row.scripts[scriptName]?.status ?? "missing";
      summary.totals[status] += 1;
    }
  }

  const report = {
    criteria,
    generatedAt: summary.generatedAt,
    rows,
    summary,
  };

  writeReport(report);

  if (issues.length > 0) {
    console.error("[script-compliance] FAILED");
    console.error(
      `[script-compliance] report -> ${toRepoRelativePath(complianceJsonPath)}`,
    );
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("[script-compliance] ok");
  console.log(
    `[script-compliance] report -> ${toRepoRelativePath(complianceJsonPath)}`,
  );
}

main();
