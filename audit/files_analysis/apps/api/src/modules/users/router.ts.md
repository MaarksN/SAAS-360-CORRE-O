# apps/api/src/modules/users/router.ts

## Purpose
- Executable source under apps. Declares exports such as createUsersRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ../../middleware/validate-body.js, ../auth/auth.service.js, @birthub/config, @birthub/database, express
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
- Size: 11661 bytes
- SHA-256: f846d0b7747359a0df0a047c0a626cdbd593fe3e5eff8859e7669a3d57875c7a
- Direct imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ../../middleware/validate-body.js, ../auth/auth.service.js, @birthub/config, @birthub/database, express
- Env vars: none
- Related tests: none
