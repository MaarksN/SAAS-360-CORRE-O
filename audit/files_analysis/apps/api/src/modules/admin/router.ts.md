# apps/api/src/modules/admin/router.ts

## Purpose
- Executable source under apps. Declares exports such as createAdminRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ../auth/auth.service.js, ../auth/cookies.js, @birthub/config, @birthub/database, express, zod
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
- Size: 3170 bytes
- SHA-256: 509bd59ab643239c84c6d8cb23abb7d4c81b4401a514cd07d9c1d105ee5e131a
- Direct imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ../auth/auth.service.js, ../auth/cookies.js, @birthub/config, @birthub/database, express, zod
- Env vars: none
- Related tests: none
