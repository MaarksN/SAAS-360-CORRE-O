# apps/api/src/modules/engagement/queues.ts

## Purpose
- Executable source under apps. Declares exports such as CrmSyncJobPayload, OutboundWebhookJobPayload, engagementQueueNames, enqueueCrmSync, enqueueOutboundWebhook.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/redis.js, @birthub/config, bullmq
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
- Size: 3076 bytes
- SHA-256: 04fa9d265cf1ad60d9f5ba11123f37e2d76057330fb0aebe441e68fea63e95ab
- Direct imports/refs: ../../lib/redis.js, @birthub/config, bullmq
- Env vars: none
- Related tests: none
