# apps/worker/src/webhooks/outbound.ts

## Purpose
- Executable source under apps. Declares exports such as OutboundWebhookJobPayload, enqueueWebhookTopicDeliveries, outboundWebhookQueueName, processOutboundWebhookJob.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ../lib/rate-limiter.js, @birthub/config, @birthub/database, @birthub/logger, bullmq, ioredis, node:crypto
- Env vars: none
- Related tests: apps/worker/test/outbound.webhooks.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- No heuristic issues were triggered by the static scan.

## Risk Score
- 15/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 5827 bytes
- SHA-256: 8239b7f08b0236924b99d31a29da65950b44116f1a4d36b7b28708f1f688f350
- Direct imports/refs: ../lib/rate-limiter.js, @birthub/config, @birthub/database, @birthub/logger, bullmq, ioredis, node:crypto
- Env vars: none
- Related tests: apps/worker/test/outbound.webhooks.test.ts
