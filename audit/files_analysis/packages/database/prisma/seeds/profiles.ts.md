# packages/database/prisma/seeds/profiles.ts

## Purpose
- Executable source under packages. Declares exports such as SeedProfile, runSeedProfile.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./seed-agents.js, ./seed-billing.js, ./seed-support.js, ./seed-tenants.js, ./seed-users.js, ./seed-workflows.js, ./shared.js, @prisma/client
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 42/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 942 bytes
- SHA-256: 6b030dc30be0053b597fb99259da9dbec6e5d4cb92b0a5df81d082f5091f6f61
- Direct imports/refs: ./seed-agents.js, ./seed-billing.js, ./seed-support.js, ./seed-tenants.js, ./seed-users.js, ./seed-workflows.js, ./shared.js, @prisma/client
- Env vars: none
- Related tests: none
