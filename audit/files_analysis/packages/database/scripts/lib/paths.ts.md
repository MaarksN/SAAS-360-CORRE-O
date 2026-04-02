# packages/database/scripts/lib/paths.ts

## Purpose
- Executable source under packages. Declares exports such as artifactsRoot, databasePackageRoot, docsRoot, migrationRegistryPath, migrationsDir, +3 more.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: node:path, node:url
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
- Size: 747 bytes
- SHA-256: cd51c4b94c4435a8fd9986b77b3c1112b5b9b9bd7c1cd2be099faf55055223a9
- Direct imports/refs: node:path, node:url
- Env vars: none
- Related tests: none
