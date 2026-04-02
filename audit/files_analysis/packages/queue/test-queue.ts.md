# packages/queue/test-queue.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./src/index
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- console_logging: Uses console-based logging 3 time(s) in runtime code.
- queue_guardrails_missing: Queue usage appears without obvious retry/retention/backpressure controls in the same file.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 72/100

## Status
- CRITICO

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 336 bytes
- SHA-256: 0b1f19a7afa058a500928895d02581c3d7adc50a2a2e4a5264fb3cca39be1cf7
- Direct imports/refs: ./src/index
- Env vars: none
- Related tests: none
