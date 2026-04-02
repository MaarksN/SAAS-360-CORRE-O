# apps/worker/src/engine/runner.execution.outcomes.ts

## Purpose
- Executable source under apps. Declares exports such as handleExecutionOutcome.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./runner.execution.js, ./runner.js, ./runner.shared.js, @birthub/database
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
- Size: 7757 bytes
- SHA-256: 4aafa1ede0cf2dfec0cb10ac523d76fb4977f00e3fc73207e3f762b64e88b06f
- Direct imports/refs: ./runner.execution.js, ./runner.js, ./runner.shared.js, @birthub/database
- Env vars: none
- Related tests: none
