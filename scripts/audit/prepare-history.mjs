import path from "node:path";
import { promises as fs } from "node:fs";

import {
  auditRoot,
  defaultBackupRoot,
  ensureDirectory,
  isHistoricalPath,
  listTrackedExistingFiles,
  relativeToAbsolute,
  resetDirectory,
  sha256File,
  toPosix,
  writeJson
} from "./shared.mjs";

async function backupAndRemoveHistory() {
  const trackedFiles = listTrackedExistingFiles();
  const filesToArchive = trackedFiles.filter((relativePath) => isHistoricalPath(relativePath));
  const removedAt = new Date().toISOString();

  await resetDirectory(defaultBackupRoot);

  const manifest = [];

  for (const relativePath of filesToArchive) {
    const sourcePath = relativeToAbsolute(relativePath);
    const backupPath = path.join(defaultBackupRoot, relativePath);
    const stats = await fs.stat(sourcePath);
    const hash = await sha256File(sourcePath);

    await ensureDirectory(path.dirname(backupPath));
    await fs.copyFile(sourcePath, backupPath);
    await fs.rm(sourcePath, { force: true });

    manifest.push({
      backup_path: backupPath,
      original_path: sourcePath,
      removed_at: removedAt,
      sha256: hash,
      size: stats.size
    });
  }

  await fs.rm(auditRoot, { force: true, recursive: true });
  await fs.mkdir(auditRoot, { recursive: true });

  await writeJson(path.join(defaultBackupRoot, "manifest.json"), {
    archived_count: manifest.length,
    archived_paths: manifest.map((entry) => toPosix(path.relative(defaultBackupRoot, entry.backup_path))),
    backup_root: defaultBackupRoot,
    generated_at: removedAt,
    items: manifest
  });

  process.stdout.write(
    `Archived ${manifest.length} historical files to ${defaultBackupRoot} and recreated ${auditRoot}.\n`
  );
}

await backupAndRemoveHistory();
