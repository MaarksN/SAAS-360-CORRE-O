# apps/api/src/modules/connectors/router.ts

## Purpose
- Executable source under apps. Declares exports such as createConnectorsRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ./service.js, @birthub/config, @birthub/database, express, zod
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
- Size: 11968 bytes
- SHA-256: 4e9361ac3c77dbaae93b563968f596be9471113d70fa49659487aca8f1990376
- Direct imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ./service.js, @birthub/config, @birthub/database, express, zod
- Env vars: none
- Related tests: none
