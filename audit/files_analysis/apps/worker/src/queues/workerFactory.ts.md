# apps/worker/src/queues/workerFactory.ts

## Purpose
- Executable source under apps. Declares exports such as DlqJobPayload, ManagedWorker, WorkerFactory.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: @birthub/logger, bullmq, ioredis
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
- Size: 4453 bytes
- SHA-256: cbe5a12cdd2f4d42f1f21996ce7b33202f4071169c088bb034a7c24a359862e4
- Direct imports/refs: @birthub/logger, bullmq, ioredis
- Env vars: none
- Related tests: none
