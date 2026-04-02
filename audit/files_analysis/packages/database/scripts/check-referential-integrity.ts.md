# packages/database/scripts/check-referential-integrity.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./lib/report.js, @birthub/logger, @prisma/client
- Env vars: DATABASE_URL
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- direct_env_access: Reads environment variables directly outside the shared config surface.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 40/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 2173 bytes
- SHA-256: 1ac8ae343b0f4ac0914fee84b540a362b5638348565b67370ea6a39816f5032f
- Direct imports/refs: ./lib/report.js, @birthub/logger, @prisma/client
- Env vars: DATABASE_URL
- Related tests: none
