# apps/worker/src/queues/agentQueue.ts

## Purpose
- Executable source under apps. Declares exports such as AgentQueuePayload, AgentQueuePriority, AgentQueueRouter, getQueueNameForPriority.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: bullmq, ioredis
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
- Size: 2177 bytes
- SHA-256: 1314b8326bb48b17cbe337b7210a2c23bf66beedc49e7e3b6637bb488d2e5cb4
- Direct imports/refs: bullmq, ioredis
- Env vars: none
- Related tests: none
