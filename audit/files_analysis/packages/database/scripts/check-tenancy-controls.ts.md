# packages/database/scripts/check-tenancy-controls.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./lib/migrations.js, ./lib/prisma-schema.js, ./lib/report.js, @birthub/logger
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 30/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 2843 bytes
- SHA-256: f6578fff619998ff8b6036ffe675394d0cf550f1c543319f2a49a45e042bdd17
- Direct imports/refs: ./lib/migrations.js, ./lib/prisma-schema.js, ./lib/report.js, @birthub/logger
- Env vars: none
- Related tests: none
