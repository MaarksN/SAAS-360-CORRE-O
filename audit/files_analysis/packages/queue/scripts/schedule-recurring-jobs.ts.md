# packages/queue/scripts/schedule-recurring-jobs.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../src, ../src/definitions
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- console_logging: Uses console-based logging 2 time(s) in runtime code.
- queue_guardrails_missing: Queue usage appears without obvious retry/retention/backpressure controls in the same file.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 67/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 648 bytes
- SHA-256: 340cea8c19bca1deaaca7213a071ef9b98c436768d3e42e916a38693e57b612f
- Direct imports/refs: ../src, ../src/definitions
- Env vars: none
- Related tests: none
