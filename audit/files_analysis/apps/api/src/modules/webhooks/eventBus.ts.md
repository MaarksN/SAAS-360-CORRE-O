# apps/api/src/modules/webhooks/eventBus.ts

## Purpose
- Executable source under apps. Declares exports such as emitWorkflowInternalEvent, initializeWorkflowInternalEventBridge.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../workflows/service.js, @birthub/config, @birthub/database, node:events
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
- Size: 1404 bytes
- SHA-256: db38ab1cacfe5cf238723ea5c280806b2b9ab46c86fff0d6d6d8ad4df9e77f43
- Direct imports/refs: ../workflows/service.js, @birthub/config, @birthub/database, node:events
- Env vars: none
- Related tests: none
