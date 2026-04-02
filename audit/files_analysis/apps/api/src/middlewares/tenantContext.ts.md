# apps/api/src/middlewares/tenantContext.ts

## Purpose
- Executable source under apps. Declares exports such as tenantContextMiddleware.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../common/cache/index.js, ../lib/problem-details.js, ../modules/auth/auth.service.js, ../tracing.js, @birthub/database, @birthub/logger, express
- Env vars: DATABASE_URL
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- direct_env_access: Reads environment variables directly outside the shared config surface.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 52/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 4619 bytes
- SHA-256: b9daa63ef09484105de47bcd28d406310733cc70c61784923560554db5ccb695
- Direct imports/refs: ../common/cache/index.js, ../lib/problem-details.js, ../modules/auth/auth.service.js, ../tracing.js, @birthub/database, @birthub/logger, express
- Env vars: DATABASE_URL
- Related tests: none
