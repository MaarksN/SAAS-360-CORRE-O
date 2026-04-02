# apps/api/src/common/guards/require-role.ts

## Purpose
- Executable source under apps. Declares exports such as RequireRole, requireAuthenticated, requireAuthenticatedSession.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/problem-details.js, ../../modules/auth/auth.service.shared.js, @birthub/database, express
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
- Size: 2178 bytes
- SHA-256: 9ea7707249b9cdf0e79ef2658e55894430bc7b1f16aeaaadf42a30b79c477e39
- Direct imports/refs: ../../lib/problem-details.js, ../../modules/auth/auth.service.shared.js, @birthub/database, express
- Env vars: none
- Related tests: none
