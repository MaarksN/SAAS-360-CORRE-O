# apps/api/src/modules/agents/router.ts

## Purpose
- Executable source under apps. Declares exports such as createInstalledAgentsRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../common/cache/index.js, ../../common/guards/index.js, ../../lib/problem-details.js, ../../lib/request-values.js, ./metrics.service.js, ./service.js, @birthub/database, express, +1 more
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
- Size: 11862 bytes
- SHA-256: 80201270167583b2cba033360c84208c3923a61e23f30dfe9c0cbe1bfc1ed949
- Direct imports/refs: ../../common/cache/index.js, ../../common/guards/index.js, ../../lib/problem-details.js, ../../lib/request-values.js, ./metrics.service.js, ./service.js, @birthub/database, express, +1 more
- Env vars: none
- Related tests: none
