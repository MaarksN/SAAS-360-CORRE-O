# apps/api/src/modules/billing/router.ts

## Purpose
- Executable source under apps. Declares exports such as createBillingRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../common/cache/index.js, ../../common/guards/index.js, ../../lib/problem-details.js, ../../middleware/validate-body.js, ./service.js, @birthub/config, @birthub/database, express, +1 more
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
- Size: 5508 bytes
- SHA-256: 4a8640c0010702cc6a9096e525c00e4e8ba9ed85fbfade2aed562fb52767ae2b
- Direct imports/refs: ../../common/cache/index.js, ../../common/guards/index.js, ../../lib/problem-details.js, ../../middleware/validate-body.js, ./service.js, @birthub/config, @birthub/database, express, +1 more
- Env vars: none
- Related tests: none
