# packages/database/prisma/seeds/seed-tenants.ts

## Purpose
- Executable source under packages. Declares exports such as seedTenants.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./shared.js, @prisma/client
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
- Size: 419 bytes
- SHA-256: a232ef81a7bbbac62862cab3ced6c831e39ec313d596726550980ca2f83a1b83
- Direct imports/refs: ./shared.js, @prisma/client
- Env vars: none
- Related tests: none
