# apps/api/src/modules/organizations/router.ts

## Purpose
- Executable source under apps. Declares exports such as createOrganizationsRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../audit/auditable.js, ../../common/guards/index.js, ../../lib/problem-details.js, ../../lib/request-values.js, ../../middleware/validate-body.js, ./service.js, @birthub/config, @birthub/database, +2 more
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
- Size: 6966 bytes
- SHA-256: b5ff18048242ef46559a0aaa897c1cfa4d9608c77ef3801055560b58c4c0b37c
- Direct imports/refs: ../../audit/auditable.js, ../../common/guards/index.js, ../../lib/problem-details.js, ../../lib/request-values.js, ../../middleware/validate-body.js, ./service.js, @birthub/config, @birthub/database, +2 more
- Env vars: none
- Related tests: none
