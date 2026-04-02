# apps/worker/src/worker.execution-state.ts

## Purpose
- Executable source under apps. Declares exports such as persistExecutionFinished, persistExecutionStarted.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: @birthub/database
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
- Size: 1826 bytes
- SHA-256: 031a50ed2c3144db022eb7684734f98be8aa09705ba95071478523e1517cf94b
- Direct imports/refs: @birthub/database
- Env vars: none
- Related tests: none
