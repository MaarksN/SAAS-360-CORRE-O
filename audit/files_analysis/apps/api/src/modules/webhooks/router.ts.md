# apps/api/src/modules/webhooks/router.ts

## Purpose
- Executable source under apps. Declares exports such as createWebhooksRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../common/guards/index.js, ../../lib/external-url.js, ../../lib/problem-details.js, ../workflows/runnerQueue.js, ../workflows/service.js, ./settings.service.js, @birthub/config, @birthub/database, +3 more
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
- Size: 7498 bytes
- SHA-256: dc33bd109325595b88cabd5a3cda9a5ff3e83b26c756201caececdd5520eb2d2
- Direct imports/refs: ../../common/guards/index.js, ../../lib/external-url.js, ../../lib/problem-details.js, ../workflows/runnerQueue.js, ../workflows/service.js, ./settings.service.js, @birthub/config, @birthub/database, +3 more
- Env vars: none
- Related tests: none
