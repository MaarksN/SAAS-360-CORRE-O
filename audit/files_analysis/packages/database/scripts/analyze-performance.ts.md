# packages/database/scripts/analyze-performance.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../f8.config.js, ./lib/report.js, @birthub/logger, @prisma/client
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
- Size: 3744 bytes
- SHA-256: a18e30fa36ac2966c243e86a393a9a34059c38d2d1cfe986272218ef91dd150f
- Direct imports/refs: ../f8.config.js, ./lib/report.js, @birthub/logger, @prisma/client
- Env vars: DATABASE_URL
- Related tests: none
