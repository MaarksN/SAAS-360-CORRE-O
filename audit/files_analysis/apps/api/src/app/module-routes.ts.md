# apps/api/src/app/module-routes.ts

## Purpose
- Executable source under apps. Declares exports such as mountModuleRouters.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../modules/admin/router.js, ../modules/agents/router.js, ../modules/analytics/router.js, ../modules/apikeys/router.js, ../modules/auth/router.js, ../modules/billing/index.js, ../modules/budget/budget-routes.js, ../modules/connectors/index.js, +15 more
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
- Size: 2913 bytes
- SHA-256: 0a64aa252d03153b6954f23cf7061e732b61b1ede1031fb35c4867d10032eadc
- Direct imports/refs: ../modules/admin/router.js, ../modules/agents/router.js, ../modules/analytics/router.js, ../modules/apikeys/router.js, ../modules/auth/router.js, ../modules/billing/index.js, ../modules/budget/budget-routes.js, ../modules/connectors/index.js, +15 more
- Env vars: none
- Related tests: none
