# packages/database/prisma/seeds/seed-users.ts

## Purpose
- Executable source under packages. Declares exports such as seedUsers.

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
- Size: 511 bytes
- SHA-256: bbc5648964e92cddf798342392c5eb787651b29de224cc870b6f12e220df05e9
- Direct imports/refs: ./shared.js, @prisma/client
- Env vars: none
- Related tests: none
