# apps/api/src/modules/invites/router.ts

## Purpose
- Executable source under apps. Declares exports such as createInvitesRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../audit/auditable.js, ../../common/guards/index.js, ../../lib/problem-details.js, ../../lib/request-values.js, ../../middleware/validate-body.js, ./service.js, @birthub/config, @birthub/database, +1 more
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
- Size: 4526 bytes
- SHA-256: 6ebc04100449382986f884230c1e8e68e75f8b324ff2b5710be55d685100ae8a
- Direct imports/refs: ../../audit/auditable.js, ../../common/guards/index.js, ../../lib/problem-details.js, ../../lib/request-values.js, ../../middleware/validate-body.js, ./service.js, @birthub/config, @birthub/database, +1 more
- Env vars: none
- Related tests: none
