# apps/api/src/modules/analytics/router.ts

## Purpose
- Executable source under apps. Declares exports such as createAnalyticsRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ./service.js, @birthub/database, express, zod
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
- Size: 4128 bytes
- SHA-256: 9d55821963e15a81a3eff02f80508a96bb5672ea19c5079e395804b3daf5a92f
- Direct imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ./service.js, @birthub/database, express, zod
- Env vars: none
- Related tests: none
