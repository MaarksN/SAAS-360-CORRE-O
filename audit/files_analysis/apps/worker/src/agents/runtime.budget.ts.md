# apps/worker/src/agents/runtime.budget.ts

## Purpose
- Executable source under apps. Declares exports such as buildToolCostTable, consumeBudget, ensureBudgetHeadroom.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./runtime.shared.js, @birthub/agents-core, @birthub/database
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
- Size: 5128 bytes
- SHA-256: 2f852d6d222f3d4d53926bcf0b69f195f817807b83ca7ffb8e236f092e579daa
- Direct imports/refs: ./runtime.shared.js, @birthub/agents-core, @birthub/database
- Env vars: none
- Related tests: none
