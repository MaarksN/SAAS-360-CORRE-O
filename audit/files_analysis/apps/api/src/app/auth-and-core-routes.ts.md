# apps/api/src/app/auth-and-core-routes.ts

## Purpose
- Executable source under apps. Declares exports such as registerAuthAndCoreRoutes.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../lib/queue.js, ./auth-routes.js, ./core-business-routes.js, @birthub/config, express
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
- Size: 515 bytes
- SHA-256: 4faa96370c717bc8196edbdba31c1f107e9743912ee50c9480366a625fba1d02
- Direct imports/refs: ../lib/queue.js, ./auth-routes.js, ./core-business-routes.js, @birthub/config, express
- Env vars: none
- Related tests: none
