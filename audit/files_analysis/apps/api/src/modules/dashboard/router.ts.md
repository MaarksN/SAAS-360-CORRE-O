# apps/api/src/modules/dashboard/router.ts

## Purpose
- Executable source under apps. Declares exports such as createDashboardRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ./service.js, @birthub/database, express
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
- Size: 2143 bytes
- SHA-256: 081828ad3555c6ff957b8f81751cf538b32fe937682257d4d5d3100571852503
- Direct imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ./service.js, @birthub/database, express
- Env vars: none
- Related tests: none
