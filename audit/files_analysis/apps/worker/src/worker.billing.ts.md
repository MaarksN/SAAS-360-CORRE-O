# apps/worker/src/worker.billing.ts

## Purpose
- Executable source under apps. Declares exports such as calculateGraceBoundary, createBillingLockResolver.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: @birthub/database, ioredis
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
- Top level: apps
- Size: 1814 bytes
- SHA-256: 04b3fe7821923ff3c7fc0d7ad214ffd2f7d354d22eb3fda097bfa799021b7c13
- Direct imports/refs: @birthub/database, ioredis
- Env vars: none
- Related tests: none
