# apps/worker/src/agents/runtime.tools.ts

## Purpose
- Executable source under apps. Declares exports such as createRuntimeTools.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./runtime.budget.js, ./runtime.shared.js, @birthub/agents-core, @birthub/agents-core/policy/engine, @birthub/agents-core/tools, @birthub/logger, zod
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
- Top level: apps
- Size: 3687 bytes
- SHA-256: 5072a7b907ec55ee5925290962760251734cf691f7230dfb00a4d6e3fe6aab0e
- Direct imports/refs: ./runtime.budget.js, ./runtime.shared.js, @birthub/agents-core, @birthub/agents-core/policy/engine, @birthub/agents-core/tools, @birthub/logger, zod
- Env vars: none
- Related tests: none
