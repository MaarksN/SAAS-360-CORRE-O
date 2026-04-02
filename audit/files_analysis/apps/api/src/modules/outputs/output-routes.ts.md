# apps/api/src/modules/outputs/output-routes.ts

## Purpose
- Executable source under apps. Declares exports such as createOutputRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ../../lib/request-values.js, ./output.service.js, @birthub/database, express, zod
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
- Size: 6246 bytes
- SHA-256: 06c58a109e41977c853fbe39327681ae44fe7f3266f3ff3f2f65576a317dbc0f
- Direct imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ../../lib/request-values.js, ./output.service.js, @birthub/database, express, zod
- Env vars: none
- Related tests: none
