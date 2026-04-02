# apps/api/src/modules/workflows/runnerQueue.ts

## Purpose
- Executable source under apps. Declares exports such as WorkflowExecutionJobPayload, WorkflowTriggerJobPayload, dedupeTriggerPayload, enqueueWorkflowExecution, enqueueWorkflowTrigger, +1 more.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: @birthub/config, @birthub/database, bullmq, ioredis, node:crypto
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
- Size: 3648 bytes
- SHA-256: ac6c5420feead58290255ca51bef65b62ee7171604e9c2e21ea8cca6d8fd3edd
- Direct imports/refs: @birthub/config, @birthub/database, bullmq, ioredis, node:crypto
- Env vars: none
- Related tests: none
