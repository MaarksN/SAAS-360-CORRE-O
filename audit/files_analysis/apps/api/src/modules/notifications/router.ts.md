# apps/api/src/modules/notifications/router.ts

## Purpose
- Executable source under apps. Declares exports such as createNotificationsRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ./service.js, express, zod
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
- Size: 4954 bytes
- SHA-256: 2511b8314843557910a358c94ac58fca60152fb37a8b29a3bc39e02717b95ab5
- Direct imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ./service.js, express, zod
- Env vars: none
- Related tests: none
