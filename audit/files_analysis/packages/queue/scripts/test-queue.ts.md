# packages/queue/scripts/test-queue.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../src/index, @birthub/shared-types, bullmq
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- console_logging: Uses console-based logging 2 time(s) in runtime code.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 52/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 1016 bytes
- SHA-256: 4f6ab2c8b860b592f0a2f4738ff5be318e36483c55f9da3fad7d373550b27bf6
- Direct imports/refs: ../src/index, @birthub/shared-types, bullmq
- Env vars: none
- Related tests: none
