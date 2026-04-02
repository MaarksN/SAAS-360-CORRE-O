# packages/testing/src/test-db.ts

## Purpose
- Executable source under packages. Declares exports such as TestDatabaseHandle, provisionTestDatabase.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./factories.js, @birthub/database, node:child_process, node:crypto, node:fs, node:path
- Env vars: none
- Related tests: packages/testing/src/test-db.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 47/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 2039 bytes
- SHA-256: c5cb88f16e27f5595dd6f7ba35caf8696625c9536c4b264c59d56a693920d84d
- Direct imports/refs: ./factories.js, @birthub/database, node:child_process, node:crypto, node:fs, node:path
- Env vars: none
- Related tests: packages/testing/src/test-db.test.ts
