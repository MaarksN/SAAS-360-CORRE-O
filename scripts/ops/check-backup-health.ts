import { dirname } from "node:path";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

function parseFlag(name: string): string | undefined {
  const flag = process.argv.find((item) => item.startsWith(`${name}=`));
  return flag ? flag.slice(name.length + 1) : undefined;
}

async function newestFileTimestamp(directory: string): Promise<{ name: string; modifiedAt: string } | null> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [] as Array<{ name: string; modifiedAt: Date }>;

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const filePath = resolve(directory, entry.name);
    const fileStat = await stat(filePath);
    files.push({
      modifiedAt: fileStat.mtime,
      name: entry.name
    });
  }

  files.sort((left, right) => right.modifiedAt.getTime() - left.modifiedAt.getTime());
  const newest = files[0];
  return newest ? { modifiedAt: newest.modifiedAt.toISOString(), name: newest.name } : null;
}

async function main(): Promise<void> {
  const backupsDir = parseFlag("--backups-dir") ?? resolve(process.cwd(), "artifacts", "backups");
  const walDir = parseFlag("--wal-dir");
  const maxBackupAgeMinutes = Number(parseFlag("--max-backup-age-minutes") ?? "1440");
  const maxWalLagMinutes = Number(parseFlag("--max-wal-lag-minutes") ?? "5");
  const outputPath =
    parseFlag("--output") ?? resolve(process.cwd(), "artifacts", "backups", "backup-health.json");

  const backup = await newestFileTimestamp(backupsDir);
  const wal = walDir ? await newestFileTimestamp(walDir) : null;
  const now = Date.now();
  const issues: string[] = [];

  if (!backup) {
    issues.push(`No backup files found in ${backupsDir}.`);
  } else {
    const backupAgeMinutes = Math.round((now - new Date(backup.modifiedAt).getTime()) / 60000);
    if (backupAgeMinutes > maxBackupAgeMinutes) {
      issues.push(`Latest backup is ${backupAgeMinutes} minutes old.`);
    }
  }

  if (walDir && !wal) {
    issues.push(`No WAL archive files found in ${walDir}.`);
  }

  if (wal) {
    const walLagMinutes = Math.round((now - new Date(wal.modifiedAt).getTime()) / 60000);
    if (walLagMinutes > maxWalLagMinutes) {
      issues.push(`Latest WAL archive is ${walLagMinutes} minutes old.`);
    }
  }

  const report = {
    checkedAt: new Date().toISOString(),
    issues,
    ok: issues.length === 0,
    backup,
    wal
  };

  await mkdir(resolve(outputPath, "..", ".."), { recursive: true }).catch(() => undefined);
  await writeFile(outputPath, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

