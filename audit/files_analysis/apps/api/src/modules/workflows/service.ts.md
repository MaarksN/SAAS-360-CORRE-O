# apps/api/src/modules/workflows/service.ts

## Purpose
- Executable source under apps. Declares exports such as ScopedIdentity, archiveWorkflow, createWorkflow, getWorkflowById, listWorkflows, +2 more.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/problem-details.js, ../billing/plan.utils.js, ../billing/service.js, ./runnerQueue.js, ./schemas.js, @birthub/config, @birthub/database, @birthub/workflows-core, +1 more
- Env vars: none
- Related tests: apps/api/tests/metrics.service.test.ts, packages/conversation-core/src/__tests__/service.test.ts

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
- Size: 12606 bytes
- SHA-256: 18b138acd1252c9a5543f9bb9fc4ad8f9d42a72fb2dd84e419cb30eef0272ed2
- Direct imports/refs: ../../lib/problem-details.js, ../billing/plan.utils.js, ../billing/service.js, ./runnerQueue.js, ./schemas.js, @birthub/config, @birthub/database, @birthub/workflows-core, +1 more
- Env vars: none
- Related tests: apps/api/tests/metrics.service.test.ts, packages/conversation-core/src/__tests__/service.test.ts
