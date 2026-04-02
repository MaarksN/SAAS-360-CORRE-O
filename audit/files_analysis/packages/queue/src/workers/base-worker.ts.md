# packages/queue/src/workers/base-worker.ts

## Purpose
- Executable source under packages. Declares exports such as WorkerMetrics, WorkerResult.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: none
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
- Size: 1005 bytes
- SHA-256: 1790beb3ef40cf16feef86ef408580c638a2f9ee2d89c88ea411e5a81b461760
- Direct imports/refs: none
- Env vars: none
- Related tests: none
