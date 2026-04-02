# Migration Operations

## Safe deploy
- Run `pnpm --filter @birthub/database db:migrate:deploy`.
- The command validates `prisma/migration-registry.json`, acquires the advisory lock, applies Prisma migrations, then executes the full post-migration checklist.

## Registry requirements
- Every migration directory under `prisma/migrations/` must exist in `prisma/migration-registry.json`.
- Required metadata includes owner, reviewer, rollback steps, staging evidence, environment coverage, pre-flight checklist, and post-flight checklist.
- Reviewer roles must include `DBA` or `DB_LEAD`.

## Drift and environment parity
- Run `pnpm --filter @birthub/database db:check:drift` against a live database.
- Run `pnpm --filter @birthub/database db:compare:envs` with `DATABASE_URL_DEV`, `DATABASE_URL_STAGING`, and `DATABASE_URL_PROD` to compare `_prisma_migrations`.

## Validation before PR
- Run `pnpm --filter @birthub/database db:validate:pr` on a disposable validation database.
- The script resets the validation database, reapplies migrations, seeds the `ci` profile, and executes the post-migration checklist.
