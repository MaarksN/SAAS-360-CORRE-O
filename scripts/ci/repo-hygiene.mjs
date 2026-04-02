#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import ts from "typescript";

import { projectRoot } from "./shared.mjs";

const require = createRequire(import.meta.url);
const codeFilePattern = /^(apps|agents|packages|scripts|tests)\/.*\.(?:[cm]?[jt]sx?|py)$/u;
const complexityFilePattern = /\.(?:[cm]?[jt]sx?)$/u;
const internalManifestPattern = /^(apps|agents|packages)\/[^/]+\/package\.json$/u;
const packageJsonFields = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
const allowedDependencyLicenses = new Set([
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "CC0-1.0",
  "ISC",
  "MIT",
  "MPL-2.0",
  "Python-2.0",
  "Unlicense"
]);
const dependencyApprovalRegister = "docs/processes/dependency-approval-register.md";
const internalChangelogPath = "docs/release/internal-packages-changelog.md";
const allowedLegacyFiles = new Set(["agents/pos-venda/main.py"]);
const auditedArtifactLogBundles = [
  {
    evidenceIndexPath: "artifacts/f11-closure-2026-03-22/EVIDENCE_INDEX.md",
    logsDirectory: "artifacts/f11-closure-2026-03-22/logs/"
  }
];

function gitCapture(args, allowFailure = false) {
  try {
    return execSync(`git ${args.join(" ")}`, {
      cwd: projectRoot,
      encoding: "utf8"
    }).trim();
  } catch (error) {
    if (allowFailure) {
      return "";
    }
    throw error;
  }
}

function hasRef(ref) {
  return Boolean(gitCapture(["rev-parse", "--verify", ref], true));
}

function resolveBaseRef() {
  const explicitBase = process.env.REPO_HYGIENE_BASE?.trim();
  if (explicitBase && hasRef(explicitBase)) {
    return explicitBase;
  }

  const githubBaseRef = process.env.GITHUB_BASE_REF?.trim();
  if (githubBaseRef) {
    const remoteRef = `origin/${githubBaseRef}`;
    if (hasRef(remoteRef)) {
      return remoteRef;
    }
  }

  return hasRef("HEAD~1") ? "HEAD~1" : null;
}

function normalizeRepoPath(filePath) {
  return filePath.replaceAll("\\", "/");
}

function listTrackedFiles() {
  const tracked = gitCapture(["ls-files"], true);
  return tracked
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(normalizeRepoPath);
}

function listChangedFiles(baseRef) {
  const diffFromBase = baseRef
    ? gitCapture(["diff", "--name-only", "--diff-filter=ACMR", `${baseRef}..HEAD`, "--"], true)
    : "";
  const diffFromHead = gitCapture(["diff", "--name-only", "--diff-filter=ACMR", "HEAD", "--"], true);
  const stagedDiff = gitCapture(["diff", "--cached", "--name-only", "--diff-filter=ACMR", "--"], true);

  const files = [diffFromBase, diffFromHead, stagedDiff]
    .join("\n")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(normalizeRepoPath);

  return [...new Set(files)];
}

function loadJson(relativePath) {
  return JSON.parse(readFileSync(path.join(projectRoot, relativePath), "utf8"));
}

function listInternalManifests(trackedFiles) {
  return trackedFiles.filter((file) => internalManifestPattern.test(file));
}

function readManifest(relativePath) {
  return loadJson(relativePath);
}

function readManifestFromRef(ref, relativePath) {
  const content = gitCapture(["show", `${ref}:${relativePath}`], true);
  return content ? JSON.parse(content) : null;
}

function collectInternalPackageNames(manifestPaths) {
  const names = new Set();

  for (const manifestPath of manifestPaths) {
    const manifest = readManifest(manifestPath);
    if (typeof manifest.name === "string" && manifest.name.trim()) {
      names.add(manifest.name.trim());
    }
  }

  return names;
}

function ensureSemver(value) {
  return typeof value === "string" && /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/u.test(value);
}

function checkManifestVersions(manifestPaths) {
  const issues = [];

  for (const manifestPath of manifestPaths) {
    const manifest = readManifest(manifestPath);
    if (!ensureSemver(manifest.version)) {
      issues.push(`${manifestPath} must declare an explicit semver version.`);
    }
  }

  return issues;
}

function checkWorkspaceProtocol(manifestPaths, internalPackageNames) {
  const issues = [];

  for (const manifestPath of manifestPaths) {
    const manifest = readManifest(manifestPath);

    for (const field of packageJsonFields) {
      const dependencies = manifest[field] ?? {};
      for (const [dependencyName, dependencyRange] of Object.entries(dependencies)) {
        if (!internalPackageNames.has(dependencyName)) {
          continue;
        }

        if (typeof dependencyRange !== "string" || !dependencyRange.startsWith("workspace:")) {
          issues.push(
            `${manifestPath} must reference internal dependency ${dependencyName} via workspace: protocol.`
          );
        }
      }
    }
  }

  return issues;
}

function resolveDependencyLicense(dependencyName, manifestPath) {
  const searchRoots = [
    projectRoot,
    path.dirname(path.join(projectRoot, manifestPath))
  ];

  for (const searchRoot of searchRoots) {
    try {
      const manifestFile = require.resolve(`${dependencyName}/package.json`, { paths: [searchRoot] });
      const dependencyManifest = JSON.parse(readFileSync(manifestFile, "utf8"));
      return typeof dependencyManifest.license === "string" ? dependencyManifest.license : null;
    } catch {
      continue;
    }
  }

  return null;
}

function findAddedExternalDependencies(changedFiles, internalPackageNames, baseRef) {
  const issues = [];
  const changedManifestPaths = changedFiles.filter((file) => internalManifestPattern.test(file));

  if (changedManifestPaths.length === 0) {
    return issues;
  }

  const approvalRegisterChanged = changedFiles.includes(dependencyApprovalRegister);

  for (const manifestPath of changedManifestPaths) {
    const currentManifest = readManifest(manifestPath);
    const previousManifest = baseRef
      ? readManifestFromRef(baseRef, manifestPath)
      : readManifestFromRef("HEAD", manifestPath);

    const addedDependencies = [];

    for (const field of packageJsonFields) {
      const previousDependencies = previousManifest?.[field] ?? {};
      const currentDependencies = currentManifest[field] ?? {};

      for (const dependencyName of Object.keys(currentDependencies)) {
        if (internalPackageNames.has(dependencyName) || dependencyName in previousDependencies) {
          continue;
        }
        addedDependencies.push(dependencyName);
      }
    }

    if (addedDependencies.length === 0) {
      continue;
    }

    if (!approvalRegisterChanged) {
      issues.push(
        `${manifestPath} adds external dependencies (${addedDependencies.join(", ")}); update ${dependencyApprovalRegister}.`
      );
    }

    for (const dependencyName of addedDependencies) {
      const license = resolveDependencyLicense(dependencyName, manifestPath);
      if (!license) {
        issues.push(`${manifestPath} adds ${dependencyName}, but its license could not be resolved from node_modules.`);
        continue;
      }

      if (!allowedDependencyLicenses.has(license)) {
        issues.push(
          `${manifestPath} adds ${dependencyName} with license ${license}; allowed licenses are ${[...allowedDependencyLicenses].join(", ")}.`
        );
      }
    }
  }

  return issues;
}

function checkNamingConventions(candidateFiles) {
  const issues = [];

  for (const relativePath of candidateFiles) {
    const normalizedPath = normalizeRepoPath(relativePath);
    const segments = normalizedPath.split("/");
    const fileName = segments.at(-1) ?? "";

    if (segments[0] === "agents" && segments.length > 1) {
      const agentDirectory = segments[1];
      if (agentDirectory === "pos-venda" && !allowedLegacyFiles.has(normalizedPath)) {
        issues.push(`${normalizedPath} uses the legacy agents/pos-venda alias. Use agents/pos_venda instead.`);
      }

      if (!/^[a-z][a-z0-9_]*$/u.test(agentDirectory) && agentDirectory !== "pos-venda") {
        issues.push(`${normalizedPath} must keep agent directory names in snake_case.`);
      }
    }

    if (segments[0] === "docs" && segments[1] === "adr") {
      issues.push(`${normalizedPath} uses docs/adr. New ADRs must live under docs/adrs.`);
    }

    if (/\.(?:[cm]?[jt]sx?)$/u.test(fileName)) {
      if (!/^[a-z0-9][a-z0-9._-]*\.[cm]?[jt]sx?$/u.test(fileName)) {
        issues.push(`${normalizedPath} must use lowercase ASCII file names.`);
      }

      if (/(?:^|\/)[a-z0-9-]+-(service|controller|repository|types)\.[cm]?[jt]sx?$/u.test(normalizedPath)) {
        issues.push(
          `${normalizedPath} must use dot-suffix service naming (*.service.ts, *.controller.ts, *.repository.ts, *.types.ts).`
        );
      }
    }
  }

  return issues;
}

function checkFileLengths(candidateFiles) {
  const issues = [];

  for (const relativePath of candidateFiles) {
    if (!codeFilePattern.test(relativePath)) {
      continue;
    }

    const absolutePath = path.join(projectRoot, relativePath);
    if (!existsSync(absolutePath)) {
      continue;
    }

    const lineCount = readFileSync(absolutePath, "utf8").split(/\r?\n/u).length;
    if (lineCount > 500) {
      issues.push(`${relativePath} has ${lineCount} lines; new or changed files must stay at 500 lines or fewer.`);
    }
  }

  return issues;
}

function computeCyclomaticComplexity(node) {
  let complexity = 1;

  function visit(child) {
    if (
      ts.isIfStatement(child) ||
      ts.isForStatement(child) ||
      ts.isForInStatement(child) ||
      ts.isForOfStatement(child) ||
      ts.isWhileStatement(child) ||
      ts.isDoStatement(child) ||
      ts.isConditionalExpression(child) ||
      ts.isCatchClause(child)
    ) {
      complexity += 1;
    }

    if (ts.isCaseClause(child) && child.expression) {
      complexity += 1;
    }

    if (
      ts.isBinaryExpression(child) &&
      [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(
        child.operatorToken.kind
      )
    ) {
      complexity += 1;
    }

    ts.forEachChild(child, visit);
  }

  if (node.body) {
    ts.forEachChild(node.body, visit);
  }

  return complexity;
}

function functionDisplayName(node) {
  if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) && node.name) {
    return node.name.getText();
  }

  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    const parent = node.parent;
    if (ts.isVariableDeclaration(parent) && parent.name) {
      return parent.name.getText();
    }
    if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
      return parent.name.getText();
    }
  }

  return "<anonymous>";
}

function checkCyclomaticComplexity(candidateFiles) {
  const issues = [];

  for (const relativePath of candidateFiles) {
    if (!complexityFilePattern.test(relativePath)) {
      continue;
    }

    const absolutePath = path.join(projectRoot, relativePath);
    if (!existsSync(absolutePath)) {
      continue;
    }

    const sourceText = readFileSync(absolutePath, "utf8");
    const sourceFile = ts.createSourceFile(absolutePath, sourceText, ts.ScriptTarget.Latest, true);

    function walk(node) {
      if (
        (ts.isFunctionDeclaration(node) ||
          ts.isFunctionExpression(node) ||
          ts.isArrowFunction(node) ||
          ts.isMethodDeclaration(node)) &&
        node.body
      ) {
        const complexity = computeCyclomaticComplexity(node);
        if (complexity > 20) {
          const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          issues.push(
            `${relativePath}:${start.line + 1} ${functionDisplayName(node)} has cyclomatic complexity ${complexity}; the limit is 20.`
          );
        }
      }

      ts.forEachChild(node, walk);
    }

    walk(sourceFile);
  }

  return issues;
}

function checkTrackedArtifacts(trackedFiles) {
  const issues = [];
  const forbiddenArtifactExtensions = [".bak", ".dump", ".env", ".log", ".sqlite", ".swp", ".tmp"];
  const trackedFileSet = new Set(trackedFiles);

  function isAllowedAuditedArtifactLog(relativePath) {
    for (const bundle of auditedArtifactLogBundles) {
      if (!relativePath.startsWith(bundle.logsDirectory) || !trackedFileSet.has(bundle.evidenceIndexPath)) {
        continue;
      }

      const checksumCandidates = [(`${relativePath}.sha256`), relativePath.replace(/\.log$/u, ".sha256")];
      if (checksumCandidates.some((candidate) => trackedFileSet.has(candidate))) {
        return true;
      }
    }

    return false;
  }

  for (const relativePath of trackedFiles.filter((file) => file.startsWith("artifacts/"))) {
    const lowerCasePath = relativePath.toLowerCase();

    if (lowerCasePath.endsWith(".log") && isAllowedAuditedArtifactLog(relativePath)) {
      continue;
    }

    if (forbiddenArtifactExtensions.some((extension) => lowerCasePath.endsWith(extension))) {
      issues.push(`${relativePath} must not be versioned inside artifacts/.`);
    }
  }

  return issues;
}

function checkInternalPackageChangelog(changedFiles) {
  const packageChanges = changedFiles.filter((file) => internalManifestPattern.test(file));
  if (packageChanges.length === 0) {
    return [];
  }

  return changedFiles.includes(internalChangelogPath)
    ? []
    : [
        `Internal package manifests changed (${packageChanges.join(", ")}); update ${internalChangelogPath}.`
      ];
}

const baseRef = resolveBaseRef();
const trackedFiles = listTrackedFiles();
const candidateFiles = process.argv.includes("--all") ? trackedFiles : listChangedFiles(baseRef);
const manifestPaths = listInternalManifests(trackedFiles);
const internalPackageNames = collectInternalPackageNames(manifestPaths);

const issues = [
  ...checkManifestVersions(manifestPaths),
  ...checkWorkspaceProtocol(manifestPaths, internalPackageNames),
  ...checkTrackedArtifacts(trackedFiles),
  ...checkNamingConventions(candidateFiles),
  ...checkFileLengths(candidateFiles),
  ...checkCyclomaticComplexity(candidateFiles),
  ...checkInternalPackageChangelog(candidateFiles),
  ...findAddedExternalDependencies(candidateFiles, internalPackageNames, baseRef)
];

if (issues.length > 0) {
  console.error("[repo-hygiene] FAILED");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `[repo-hygiene] ok (${candidateFiles.length} file${candidateFiles.length === 1 ? "" : "s"} evaluated${baseRef ? `, base=${baseRef}` : ""})`
  );
}
