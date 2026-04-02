# packages/database/scripts/validate-migrations-on-test-db.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./lib/paths.js, ./lib/process.js, @birthub/logger, node:path
- Env vars: ALLOW_DESTRUCTIVE_DB_VALIDATION, DATABASE_URL, SEED_PROFILE
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
- Size: 2103 bytes
- SHA-256: 071f36450821b0683869e5d6bdf22b2ed7efbb1c1c243165ea2ff98fe3f19dc2
- Direct imports/refs: ./lib/paths.js, ./lib/process.js, @birthub/logger, node:path
- Env vars: ALLOW_DESTRUCTIVE_DB_VALIDATION, DATABASE_URL, SEED_PROFILE
- Related tests: none
