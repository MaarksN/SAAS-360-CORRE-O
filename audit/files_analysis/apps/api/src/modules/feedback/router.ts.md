# apps/api/src/modules/feedback/router.ts

## Purpose
- Executable source under apps. Declares exports such as createFeedbackRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ./service.js, express, zod
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
- Size: 2413 bytes
- SHA-256: fb818a9acd3e4d7128a7a75364a925c5e5432bdec6275765991d1d3dff3b3e35
- Direct imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ./service.js, express, zod
- Env vars: none
- Related tests: none
