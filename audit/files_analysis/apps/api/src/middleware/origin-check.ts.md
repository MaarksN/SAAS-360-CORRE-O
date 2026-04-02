# apps/api/src/middleware/origin-check.ts

## Purpose
- Executable source under apps. Declares exports such as originValidationMiddleware.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../lib/problem-details.js, express
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 62/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 1453 bytes
- SHA-256: 5c11e15b7eec93bb01d55df074b404c1fc21c1c98b348da3e323bb847c60c60f
- Direct imports/refs: ../lib/problem-details.js, express
- Env vars: none
- Related tests: none
