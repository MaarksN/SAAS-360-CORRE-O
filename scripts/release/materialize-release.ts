import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const RELEASE_VERSION = "1.0.0";

type ArtifactEntry = {
  path: string;
  sha256: string;
  sizeBytes: number;
};

function parseFlag(name: string): string | undefined {
  const arg = process.argv.find((value) => value.startsWith(`${name}=`));
  return arg ? arg.slice(name.length + 1) : undefined;
}

async function listFiles(folder: string): Promise<string[]> {
  const dirents = await readdir(folder, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map(async (entry) => {
      const absolute = join(folder, entry.name);
      if (entry.isDirectory()) {
        return listFiles(absolute);
      }

      return [absolute];
    })
  );

  return files.flat();
}

async function sha256(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}

async function buildChecksumManifest(paths: string[], root: string): Promise<ArtifactEntry[]> {
  const entries: ArtifactEntry[] = [];

  for (const filePath of paths) {
    const info = await stat(filePath);
    if (!info.isFile()) {
      continue;
    }

    entries.push({
      path: relative(root, filePath).replaceAll("\\", "/"),
      sha256: await sha256(filePath),
      sizeBytes: info.size
    });
  }

  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

async function main() {
  const root = process.cwd();
  const releaseDir = resolve(root, "artifacts", "release");
  const sbomDir = resolve(root, "artifacts", "sbom");
  const manifestsDir = resolve(root, "releases", "manifests");
  const notesDir = resolve(root, "releases", "notes");
  const logsDir = resolve(root, "logs", "releases");
  const runDate = new Date().toISOString();
  const semverTag = parseFlag("--tag") ?? `v${RELEASE_VERSION}`;

  await mkdir(releaseDir, { recursive: true });
  await mkdir(sbomDir, { recursive: true });
  await mkdir(manifestsDir, { recursive: true });
  await mkdir(notesDir, { recursive: true });
  await mkdir(logsDir, { recursive: true });

  const existingReleaseArtifacts = await listFiles(releaseDir);
  const sbomArtifacts = await listFiles(sbomDir);
  const discoveredArtifacts = [...existingReleaseArtifacts, ...sbomArtifacts];

  if (discoveredArtifacts.length === 0) {
    throw new Error("No release artifacts found under artifacts/release or artifacts/sbom.");
  }

  const catalogPath = resolve(manifestsDir, "release_artifact_catalog.md");
  const summaryPath = resolve(releaseDir, "release-artifact-catalog.json");
  const checksumPath = resolve(releaseDir, "checksums-manifest.sha256");
  const logPath = resolve(logsDir, `release-${RELEASE_VERSION}-${runDate.replaceAll(":", "-")}.log`);

  const initialEntries = await buildChecksumManifest(discoveredArtifacts, root);
  const catalog = [
    "# Release Artifact Catalog",
    "",
    `- Release version: ${RELEASE_VERSION}`,
    `- Semantic tag candidate: ${semverTag}`,
    `- Generated at: ${runDate}`,
    "",
    "| Artifact | SHA-256 | Size (bytes) |",
    "| --- | --- | ---: |",
    ...initialEntries.map((entry) => `| \`${entry.path}\` | \`${entry.sha256}\` | ${entry.sizeBytes} |`)
  ].join("\n");
  await writeFile(catalogPath, `${catalog}\n`, "utf8");

  const releaseNotesPath = resolve(notesDir, `v${RELEASE_VERSION}.md`);
  const releaseNotes = [
    `# Release Notes v${RELEASE_VERSION}`,
    "",
    `- Date: ${runDate}`,
    `- Tag preparada: ${semverTag}`,
    "",
    "## Pacote de release",
    "",
    "- SBOM (`artifacts/sbom/bom.xml`) incorporado ao pacote.",
    "- Manifesto de checksums (`artifacts/release/checksums-manifest.sha256`) atualizado.",
    "- Catálogo auditável (`releases/manifests/release_artifact_catalog.md`) atualizado.",
    "",
    "## Operacional",
    "",
    "- Workflow de CD exige preflight staging/production e evidência de rollback.",
    "- Script de rollback disponível em `scripts/ops/rollback-release.sh`.",
    "",
    "## Tag semântica da release",
    "",
    "```bash",
    `git tag ${semverTag}`,
    `git push origin ${semverTag}`,
    "```"
  ].join("\n");
  await writeFile(releaseNotesPath, `${releaseNotes}\n`, "utf8");

  const logBody = [
    `release_version=${RELEASE_VERSION}`,
    `semver_tag=${semverTag}`,
    `generated_at=${runDate}`,
    `artifact_count=${initialEntries.length}`,
    ...initialEntries.map((entry) => `artifact=${entry.path};sha256=${entry.sha256};size=${entry.sizeBytes}`)
  ].join("\n");
  await writeFile(logPath, `${logBody}\n`, "utf8");

  await writeFile(
    summaryPath,
    JSON.stringify(
      {
        generatedAt: runDate,
        logPath: relative(root, logPath).replaceAll("\\", "/"),
        releaseVersion: RELEASE_VERSION,
        semverTag,
        artifacts: initialEntries
      },
      null,
      2
    ),
    "utf8"
  );

  const allArtifacts = await listFiles(releaseDir).then((releaseArtifacts) => [...releaseArtifacts, ...sbomArtifacts]);
  const finalEntries = await buildChecksumManifest(allArtifacts, root);
  const checksumBody = finalEntries.map((entry) => `${entry.sha256}  ${entry.path}`).join("\n");
  await writeFile(checksumPath, `${checksumBody}\n`, "utf8");

  process.stdout.write(`Release artifacts materialized (${finalEntries.length} files).\n`);
  process.stdout.write(`Checksum manifest: ${relative(root, checksumPath)}\n`);
  process.stdout.write(`Catalog: ${relative(root, catalogPath)}\n`);
  process.stdout.write(`Release notes: ${relative(root, releaseNotesPath)}\n`);
  process.stdout.write(`Release log: ${relative(root, logPath)}\n`);
  process.stdout.write(`Summary JSON: ${relative(root, summaryPath)}\n`);
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
