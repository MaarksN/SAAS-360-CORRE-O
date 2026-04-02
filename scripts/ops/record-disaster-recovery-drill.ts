import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

function parseFlag(name: string): string | undefined {
  const flag = process.argv.find((item) => item.startsWith(`${name}=`));
  return flag ? flag.slice(name.length + 1) : undefined;
}

function mustParseDate(flagName: string): Date {
  const raw = parseFlag(flagName);
  if (!raw) {
    throw new Error(`Missing required flag ${flagName}=<ISO date>.`);
  }

  const value = new Date(raw);
  if (Number.isNaN(value.getTime())) {
    throw new Error(`Invalid ISO date for ${flagName}: ${raw}`);
  }

  return value;
}

async function main(): Promise<void> {
  const startedAt = mustParseDate("--started-at");
  const restoredAt = mustParseDate("--restored-at");
  const targetPoint = mustParseDate("--target-point");
  const recoveredPoint = mustParseDate("--recovered-point");
  const outputPath =
    parseFlag("--output") ?? resolve(process.cwd(), "artifacts", "backups", "drill-rto-rpo.json");

  const rtoMinutes = Math.round((restoredAt.getTime() - startedAt.getTime()) / 60000);
  const rpoMinutes = Math.round(Math.abs(targetPoint.getTime() - recoveredPoint.getTime()) / 60000);
  const report = {
    checkedAt: new Date().toISOString(),
    recoveredPoint: recoveredPoint.toISOString(),
    restoredAt: restoredAt.toISOString(),
    rpoMinutes,
    rtoMinutes,
    startedAt: startedAt.toISOString(),
    targetPoint: targetPoint.toISOString()
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
