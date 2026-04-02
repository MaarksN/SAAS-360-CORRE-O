# apps/api/src/modules/apikeys/router.ts

## Purpose
- Executable source under apps. Declares exports such as createApiKeysRouter.

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
- Size: 3939 bytes
- SHA-256: 0f0dad5bf398657d7346ea8181aa8497edfbc1fe9a9723f9c02d5b56a19af248
- Direct imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ../../middleware/validate-body.js, ../auth/auth.service.js, @birthub/config, @birthub/database, express
- Env vars: none
- Related tests: none
