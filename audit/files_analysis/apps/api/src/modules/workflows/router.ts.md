# apps/api/src/modules/workflows/router.ts

## Purpose
- Executable source under apps. Declares exports such as createWorkflowsRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ../../middleware/validate-body.js, ../webhooks/eventBus.js, ./schemas.js, ./service.js, @birthub/config, @birthub/database, +2 more
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
- Size: 6333 bytes
- SHA-256: 33e5638c71e6bf3d31c162696a6f39e89da0feea697a02b6853a9fe4175590c7
- Direct imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ../../middleware/validate-body.js, ../webhooks/eventBus.js, ./schemas.js, ./service.js, @birthub/config, @birthub/database, +2 more
- Env vars: none
- Related tests: none
