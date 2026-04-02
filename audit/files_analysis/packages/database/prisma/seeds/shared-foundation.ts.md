# packages/database/prisma/seeds/shared-foundation.ts

## Purpose
- Executable source under packages. Declares exports such as PlanMap, SeedPlan, TenantSeed, asJson, buildStagingTenants, +6 more.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: @prisma/client, node:crypto
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
- Size: 6459 bytes
- SHA-256: 320662a58ed37be98200415998ec327dc45845e4eb44bd6c14b760b1dd506d01
- Direct imports/refs: @prisma/client, node:crypto
- Env vars: none
- Related tests: none
