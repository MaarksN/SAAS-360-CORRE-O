# apps/api/src/modules/agents/service.execution.ts

## Purpose
- Executable source under apps. Declares exports such as queueInstalledAgentExecution.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/prisma-json.js, ../../lib/problem-details.js, ../../lib/queue.js, ./queue.js, ./service.repository.js, ./service.snapshot.js, ./service.types.js, @birthub/config, +2 more
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
- Size: 6583 bytes
- SHA-256: 5235e38d37dc3ecc6d2ea4daf0bc31f0d42def43729a439e816aac978e02f192
- Direct imports/refs: ../../lib/prisma-json.js, ../../lib/problem-details.js, ../../lib/queue.js, ./queue.js, ./service.repository.js, ./service.snapshot.js, ./service.types.js, @birthub/config, +2 more
- Env vars: none
- Related tests: none
