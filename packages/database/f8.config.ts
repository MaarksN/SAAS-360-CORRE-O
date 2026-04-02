export type MigrationSeverity = "P0" | "P1" | "P2";
export type QueryBudgetCategory = "migration" | "oltp" | "report";

export const F8_CONFIG = {
  advisoryLockId: 3608,
  backupPolicy: {
    drillCadenceMonths: 6,
    maxBackupAgeMinutes: 60 * 24,
    requiredWalArchiveLagMinutes: 5,
    rpoMinutes: 5
  },
  defaultApproverRoles: ["DBA", "DB_LEAD"] as const,
  expectedMigrationEnvironments: ["dev", "staging", "prod"] as const,
  highWriteTables: [
    "agent_budget_events",
    "audit_logs",
    "billing_events",
    "crm_sync_events",
    "webhook_deliveries"
  ] as const,
  migrationChecklist: {
    post: [
      "drift_check",
      "fk_index_audit",
      "integrity_health_check",
      "migration_state_report",
      "release_smoke",
      "rls_audit"
    ],
    pre: ["backup_confirmed", "maintenance_window", "rollback_validated", "stakeholder_notice"]
  },
  queryTimeoutsMs: {
    migration: 10 * 60 * 1000,
    oltp: 1_000,
    report: 30_000
  },
  serviceConnectionLimits: {
    api: 15,
    web: 5,
    worker: 8
  }
} as const;

export function isApproverRole(value: string): boolean {
  return (F8_CONFIG.defaultApproverRoles as readonly string[]).includes(value);
}

export function resolveDefaultQueryTimeout(category: QueryBudgetCategory): number {
  return F8_CONFIG.queryTimeoutsMs[category];
}
