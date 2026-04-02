import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { F8_CONFIG, type MigrationSeverity } from "../../f8.config.js";
import { migrationRegistryPath, migrationsDir } from "./paths.js";

export interface MigrationRegistryEntry {
  environments: string[];
  estimatedDurationMinutes: number;
  impact: "high" | "low" | "medium";
  maintenanceWindowSlaMinutes: number;
  notes?: string;
  owner: string;
  postMigrationChecklist: string[];
  preProductionChecklist: string[];
  review: {
    approverRoles: string[];
    reviewer: string;
  };
  rollback: {
    strategy: string;
    steps: string[];
    testedEnvironments: string[];
  };
  severity: MigrationSeverity;
  strategy: {
    backwardCompatible: boolean;
    batching: {
      required: boolean;
      strategy?: string;
    };
    expandContract: boolean;
    transactional: boolean;
  };
  validation: {
    driftChecked: boolean;
    rlsReviewed: boolean;
    rollbackTested: boolean;
    viewsAndRoutinesReviewed: boolean;
  };
}

type MigrationRegistryFile = {
  generatedAt: string;
  migrations: Record<string, MigrationRegistryEntry>;
};

export async function listMigrationDirectories(): Promise<string[]> {
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export async function readMigrationSql(migrationName: string): Promise<string> {
  return readFile(join(migrationsDir, migrationName, "migration.sql"), "utf8");
}

export async function readMigrationRegistry(): Promise<Record<string, MigrationRegistryEntry>> {
  const raw = await readFile(migrationRegistryPath, "utf8");
  const parsed = JSON.parse(raw) as MigrationRegistryFile;
  return parsed.migrations;
}

export function collectRlsEnabledTables(sql: string): string[] {
  return Array.from(
    sql.matchAll(/ALTER TABLE "([^"]+)" ENABLE ROW LEVEL SECURITY;/g),
    (match) => match[1]
  ).filter((tableName): tableName is string => Boolean(tableName));
}

export function containsRlsDisable(sql: string): boolean {
  return /DISABLE ROW LEVEL SECURITY;/i.test(sql);
}

export function collectCreatedViews(sql: string): string[] {
  return Array.from(
    sql.matchAll(/CREATE\s+(?:MATERIALIZED\s+)?VIEW\s+"?([A-Za-z0-9_]+)"?/gi),
    (match) => match[1]
  ).filter((viewName): viewName is string => Boolean(viewName));
}

export function collectCreatedRoutines(sql: string): string[] {
  return Array.from(
    sql.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?(?:FUNCTION|PROCEDURE)\s+"?([A-Za-z0-9_]+)"?/gi),
    (match) => match[1]
  ).filter((routineName): routineName is string => Boolean(routineName));
}

export function collectRiskFlags(sql: string): string[] {
  const flags = new Set<string>();

  if (/DROP\s+COLUMN/i.test(sql)) {
    flags.add("drop_column");
  }

  if (/DROP\s+TABLE/i.test(sql)) {
    flags.add("drop_table");
  }

  if (/ALTER\s+TABLE[\s\S]*SET\s+NOT\s+NULL/i.test(sql)) {
    flags.add("set_not_null");
  }

  if (/ALTER\s+TABLE[\s\S]*ALTER\s+COLUMN[\s\S]*TYPE/i.test(sql)) {
    flags.add("alter_column_type");
  }

  if (/UPDATE\s+"[^"]+"\s+SET/i.test(sql)) {
    flags.add("bulk_update");
  }

  if (/DELETE\s+FROM\s+"[^"]+"/i.test(sql)) {
    flags.add("bulk_delete");
  }

  if (/CREATE\s+INDEX\s+CONCURRENTLY/i.test(sql)) {
    flags.add("concurrent_index");
  }

  return Array.from(flags);
}

export function validateRegistryEntryShape(name: string, entry: MigrationRegistryEntry): string[] {
  const issues: string[] = [];

  if (!entry.owner.trim()) {
    issues.push(`${name}: owner is required.`);
  }

  if (entry.review.approverRoles.length === 0) {
    issues.push(`${name}: at least one approver role is required.`);
  }

  if (!entry.review.approverRoles.some((role) => F8_CONFIG.defaultApproverRoles.includes(role as never))) {
    issues.push(`${name}: approver roles must include DBA or DB_LEAD.`);
  }

  for (const requiredStep of F8_CONFIG.migrationChecklist.pre) {
    if (!entry.preProductionChecklist.includes(requiredStep)) {
      issues.push(`${name}: missing pre-production checklist item '${requiredStep}'.`);
    }
  }

  for (const requiredStep of F8_CONFIG.migrationChecklist.post) {
    if (!entry.postMigrationChecklist.includes(requiredStep)) {
      issues.push(`${name}: missing post-migration checklist item '${requiredStep}'.`);
    }
  }

  if (entry.rollback.steps.length === 0) {
    issues.push(`${name}: rollback steps are required.`);
  }

  if (entry.rollback.testedEnvironments.length === 0) {
    issues.push(`${name}: rollback test evidence is required.`);
  }

  if (entry.environments.length === 0) {
    issues.push(`${name}: environment coverage is required.`);
  }

  return issues;
}
