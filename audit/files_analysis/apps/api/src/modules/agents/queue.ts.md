# apps/api/src/modules/agents/queue.ts

## Purpose
- Executable source under apps. Declares exports such as AgentExecutionJob, enqueueInstalledAgentExecution, getInstalledAgentQueueStats.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/queue.js, ../../lib/redis.js, @birthub/config, bullmq
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
- Size: 3153 bytes
- SHA-256: 5908685156072ceeb36f56185839d93d95f5d9980726894aa6b3522c9486b0cb
- Direct imports/refs: ../../lib/queue.js, ../../lib/redis.js, @birthub/config, bullmq
- Env vars: none
- Related tests: apps/api/tests/queue-backpressure.test.ts, apps/worker/test/queue.isolation.test.ts, packages/queue/tests/job-context.test.ts, packages/queue/tests/workers.test.ts
