# apps/api/src/app/auth-routes.ts

## Purpose
- Executable source under apps. Declares exports such as registerAuthRoutes.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../common/guards/index.js, ../lib/problem-details.js, ../middleware/rate-limit.js, ../middleware/validate-body.js, ../modules/auth/auth.service.js, ../modules/auth/cookies.js, @birthub/config, express, +1 more
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
- Size: 7286 bytes
- SHA-256: d1b780c56bbd33257615a0b9c9f0a818510bc5563cf77fa287213820d5f83be5
- Direct imports/refs: ../common/guards/index.js, ../lib/problem-details.js, ../middleware/rate-limit.js, ../middleware/validate-body.js, ../modules/auth/auth.service.js, ../modules/auth/cookies.js, @birthub/config, express, +1 more
- Env vars: none
- Related tests: none
