# apps/api/src/modules/budget/budget-routes.ts

## Purpose
- Executable source under apps. Declares exports such as createBudgetRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ./budget.service.js, ./budget.types.js, @birthub/database, express, zod
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
- Size: 4731 bytes
- SHA-256: 1dc5127274393196e953f216a34bf05542af621c9222509eaf4cef8c49c9f4ce
- Direct imports/refs: ../../common/guards/index.js, ../../lib/problem-details.js, ./budget.service.js, ./budget.types.js, @birthub/database, express, zod
- Env vars: none
- Related tests: none
