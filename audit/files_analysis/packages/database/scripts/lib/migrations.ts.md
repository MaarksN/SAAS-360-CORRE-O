# packages/database/scripts/lib/migrations.ts

## Purpose
- Executable source under packages. Declares exports such as MigrationRegistryEntry, collectCreatedRoutines, collectCreatedViews, collectRiskFlags, collectRlsEnabledTables, +5 more.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../../f8.config.js, ./paths.js, node:fs/promises, node:path
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
- Size: 4777 bytes
- SHA-256: 2488389f32a55140078dfbeb0409886305b38c064879c497f4acc9131446a05d
- Direct imports/refs: ../../f8.config.js, ./paths.js, node:fs/promises, node:path
- Env vars: none
- Related tests: none
