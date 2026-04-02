# apps/api/src/modules/sessions/router.ts

## Purpose
- Executable source under apps. Declares exports such as createSessionsRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ../auth/auth.service.js, ../auth/cookies.js, @birthub/config, express
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
- Size: 2745 bytes
- SHA-256: ad206fd01ea6c3c4b86438a41c1280128321462de13fadb0a135ba092a98ffed
- Direct imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ../auth/auth.service.js, ../auth/cookies.js, @birthub/config, express
- Env vars: none
- Related tests: none
