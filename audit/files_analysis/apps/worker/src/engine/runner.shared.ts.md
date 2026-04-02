# apps/worker/src/engine/runner.shared.ts

## Purpose
- Executable source under apps. Declares exports such as MAX_ATTEMPTS, StepOutputEnvelope, WORKFLOW_EXECUTION_QUEUE, calculateBackoff, consumeSharedAgentBudget, +3 more.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: @birthub/database, @birthub/logger, node:crypto
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 30/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 2652 bytes
- SHA-256: 0c5cef9658aa66da8bbb0255be12fb980777d943422057b4fe356de16d915787
- Direct imports/refs: @birthub/database, @birthub/logger, node:crypto
- Env vars: none
- Related tests: none
