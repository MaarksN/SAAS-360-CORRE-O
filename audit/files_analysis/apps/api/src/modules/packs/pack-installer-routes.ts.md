# apps/api/src/modules/packs/pack-installer-routes.ts

## Purpose
- Executable source under apps. Declares exports such as createPackInstallerRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ../../lib/request-values.js, ../billing/index.js, ./pack-installer.service.js, @birthub/database, express, zod
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
- Size: 6251 bytes
- SHA-256: 34c05437882331de9c5ac685fb9693ffcb855e6b6d207fcab3e87acd040e881f
- Direct imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ../../lib/request-values.js, ../billing/index.js, ./pack-installer.service.js, @birthub/database, express, zod
- Env vars: none
- Related tests: none
