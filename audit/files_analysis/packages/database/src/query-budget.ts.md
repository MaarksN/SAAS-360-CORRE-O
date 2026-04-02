# packages/database/src/query-budget.ts

## Purpose
- Executable source under packages. Declares exports such as QueryBudgetContext, getCurrentQueryBudget, resolveQueryTimeoutMs, runWithQueryBudget.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../f8.config.js, node:async_hooks
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 30/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 1337 bytes
- SHA-256: 51b8e415f8584380621657bb93a2c43550dcdfe314844a46263160a864a18262
- Direct imports/refs: ../f8.config.js, node:async_hooks
- Env vars: none
- Related tests: none
