# @birthub/database

Database runtime, Prisma schema, migrations, seeds, and operational guardrails for BirthHub 360.

## Key docs
- `docs/F8_IMPLEMENTATION.md`
- `docs/MIGRATIONS.md`
- `docs/SEEDS.md`
- `docs/BACKUP_RECOVERY.md`

## Key commands
- `pnpm --filter @birthub/database db:migrate:deploy`
- `pnpm --filter @birthub/database db:check:all`
- `pnpm --filter @birthub/database db:seed:ci`
- `pnpm --filter @birthub/database db:seed:staging`
- `pnpm --filter @birthub/database db:validate:pr`
