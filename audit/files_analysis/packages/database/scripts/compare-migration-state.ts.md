# packages/database/scripts/compare-migration-state.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../f8.config.js, ./lib/report.js, @birthub/logger, @prisma/client
- Env vars: DATABASE_URL_DEV, DATABASE_URL_PROD, DATABASE_URL_STAGING
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
- Size: 3555 bytes
- SHA-256: eacade5db4cc44891e1d2b43c96f101aa3b8be9e78692fcb2bb1472f20929b7e
- Direct imports/refs: ../f8.config.js, ./lib/report.js, @birthub/logger, @prisma/client
- Env vars: DATABASE_URL_DEV, DATABASE_URL_PROD, DATABASE_URL_STAGING
- Related tests: none
