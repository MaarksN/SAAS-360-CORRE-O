# F8 Implementation

This package now carries the F8 controls for database migration governance, tenant isolation, seed idempotency, performance auditing, and backup/recovery operations.

## 1. Migrations and rollback
- `prisma/migration-registry.json` is the source of truth for owner, reviewer, rollback, pre-flight and post-flight checklist per migration.
- `scripts/check-migration-governance.ts` validates registry coverage, rollback evidence, reviewer roles, environment coverage, and expand-contract metadata.
- `scripts/migrate-deploy-safe.ts` acquires a PostgreSQL advisory lock before `prisma migrate deploy`, then runs the post-migration checklist.
- `scripts/compare-migration-state.ts` compares `_prisma_migrations` across `DATABASE_URL_DEV`, `DATABASE_URL_STAGING`, and `DATABASE_URL_PROD` when available.
- `scripts/check-schema-drift.ts` compares the live database schema against `prisma/schema.prisma` using `prisma migrate diff --exit-code`.

## 2. Zero-downtime strategy
- Expand-contract and batching expectations are enforced in `scripts/check-migration-governance.ts`.
- Validation in test databases is implemented by `scripts/validate-migrations-on-test-db.ts`.
- The post-migration checklist is centralized in `scripts/post-migration-checklist.ts`.
- `prisma/migrations/20260322000100_cycle8_data_resilience_controls` hardens RLS coverage, audit immutability, and high-write table tuning.

## 3. Seeds, fixtures and idempotency
- `prisma/seed.ts` is now an orchestrator for profiles: `development`, `smoke`, `ci`, and `staging`.
- Domain seeds live in `prisma/seeds/seed-tenants.ts`, `seed-users.ts`, `seed-agents.ts`, `seed-workflows.ts`, `seed-billing.ts`, and `seed-support.ts`.
- Shared idempotent helpers live in `prisma/seeds/shared.ts`.
- Test factories remain isolated in `packages/testing/src/factories.ts`.
- Root scripts `db:seed:ci`, `db:seed:smoke`, and `db:seed:staging` standardize population per environment.

## 4. RLS and tenant isolation
- `scripts/check-tenancy-controls.ts` audits every tenant-scoped Prisma model for `tenantId` index coverage and RLS coverage.
- `scripts/check-raw-query-joins.ts` flags JOIN-heavy raw SQL without tenant markers.
- `src/client.ts` blocks explicit cross-tenant attempts at the Prisma layer and writes an immutable audit trail via `audit_logs`.
- `test/rls.test.ts` and `test/migration.test.ts` continue to exercise isolation behavior against a live database when configured.

## 5. Performance and integrity
- `src/query-budget.ts` and `src/client.ts` implement query budgets by category: `oltp`, `report`, and `migration`.
- `src/client.ts` normalizes pooling parameters with service-aware connection limits and PgBouncer compatibility.
- `scripts/analyze-performance.ts` reports slow queries, unused indexes, and autovacuum coverage.
- `scripts/check-fk-indexes.ts` validates foreign-key index coverage from the Prisma schema.
- `scripts/check-referential-integrity.ts` validates PostgreSQL foreign key constraints.

## 6. Backup, recovery and staging
- `scripts/ops/check-backup-health.ts` validates backup freshness and WAL archival lag.
- `scripts/ops/refresh-staging.ts` orchestrates restore plus anonymized staging seed after explicit `--apply`.
- `scripts/ops/record-disaster-recovery-drill.ts` writes RTO/RPO measurements from a drill execution.
- Operational guidance is documented in `docs/BACKUP_RECOVERY.md`.
