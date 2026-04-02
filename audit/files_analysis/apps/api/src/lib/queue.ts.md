# apps/api/src/lib/queue.ts

## Purpose
- Executable source under apps. Declares exports such as QueueBackpressureError, TenantQueueRateLimitError, enqueueTask, getTaskQueue, pingRedis.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ./redis.js, @birthub/config, bullmq, zod
- Env vars: none
- Related tests: apps/api/tests/queue-backpressure.test.ts, apps/worker/test/queue.isolation.test.ts, packages/queue/tests/job-context.test.ts, packages/queue/tests/workers.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 27/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 3408 bytes
- SHA-256: 81135a8a5fa8be2effe9adea773aa113ab8259aac4194a1b1b0518e1d09ae4e8
- Direct imports/refs: ./redis.js, @birthub/config, bullmq, zod
- Env vars: none
- Related tests: apps/api/tests/queue-backpressure.test.ts, apps/worker/test/queue.isolation.test.ts, packages/queue/tests/job-context.test.ts, packages/queue/tests/workers.test.ts
