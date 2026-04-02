# Seed Profiles

## Profiles
- `development`: full baseline for local development.
- `smoke`: minimal tenant, users, workflow, billing, and support artifacts for release checks.
- `ci`: same minimal footprint as `smoke`, used automatically in `test:core` and `test:isolation`.
- `staging`: anonymized tenants derived from the development baseline.

## Commands
- `pnpm --filter @birthub/database db:seed`
- `pnpm --filter @birthub/database db:seed:smoke`
- `pnpm --filter @birthub/database db:seed:ci`
- `pnpm --filter @birthub/database db:seed:staging`

## Required data by environment
- Development: plans, organizations, memberships, sessions, agents, workflows, customers, billing, quota, invites, notifications, and signing secrets.
- CI/Smoke: one tenant with owner/member, one agent, two workflows, one subscription, and support artifacts.
- Staging: anonymized tenants, anonymized users, billing catalog, support artifacts, and the same tenant-isolation guarantees as development.

## Idempotency contract
- Seeds must use `upsert`, deterministic identifiers, or existence checks.
- Seeds must not require `db:reset` to be safe.
- Each domain seed (`seed-tenants`, `seed-users`, `seed-agents`, `seed-workflows`, `seed-billing`, `seed-support`) can run independently because it recreates its own prerequisites.
