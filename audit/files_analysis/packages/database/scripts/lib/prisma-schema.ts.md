# packages/database/scripts/lib/prisma-schema.ts

## Purpose
- Executable source under packages. Declares exports such as ParsedField, ParsedModel, getTenantScopedModels, hasIndexCoverage, parsePrismaSchema.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./paths.js, node:fs/promises
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
- Size: 4593 bytes
- SHA-256: 7a1c116772d300f44f0efcacb408a4eda15444077d54074a05720ef9d9c30d28
- Direct imports/refs: ./paths.js, node:fs/promises
- Env vars: none
- Related tests: none
