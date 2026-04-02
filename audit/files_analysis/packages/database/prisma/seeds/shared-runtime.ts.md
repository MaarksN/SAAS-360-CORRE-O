# packages/database/prisma/seeds/shared-runtime.ts

## Purpose
- Executable source under packages. Declares exports such as ensureAgents, ensureUsers, ensureWorkflows.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./shared-foundation.js, @prisma/client
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
- Size: 9169 bytes
- SHA-256: ecdc8cfa1b5b5023447516db1c09280dd66b340a68bbde0c05d5c42ce965e0c4
- Direct imports/refs: ./shared-foundation.js, @prisma/client
- Env vars: none
- Related tests: none
