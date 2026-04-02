# apps/api/src/modules/privacy/router.ts

## Purpose
- Executable source under apps. Declares exports such as createPrivacyRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ../../middleware/validate-body.js, ./service.js, @birthub/config, @birthub/database, express
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
- Size: 2017 bytes
- SHA-256: e8642cd40684d42b47c7d312ed6ada9764f02250fb2b5ff4d53f03a2e97ed5e2
- Direct imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ../../middleware/validate-body.js, ./service.js, @birthub/config, @birthub/database, express
- Env vars: none
- Related tests: none
