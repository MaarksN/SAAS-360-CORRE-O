# apps/worker/src/runtime.integration.test.ts

## Purpose
- Automated verification asset for runtime or package behavior.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./executors/planExecutor.js, @birthub/agents-core/tools, @birthub/testing, node:assert/strict, node:test
- Env vars: DATABASE_URL
- Related tests: apps/worker/src/runtime.integration.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- No heuristic issues were triggered by the static scan.

## Risk Score
- 5/100

## Status
- OK

## Evidence
- Kind: test
- Language: TypeScript
- Top level: apps
- Size: 2804 bytes
- SHA-256: 283bbdebf5f1bb0aeee8fcfad390a31e9a05a6b0dd90f6c8c7a0b82f6d2862e8
- Direct imports/refs: ./executors/planExecutor.js, @birthub/agents-core/tools, @birthub/testing, node:assert/strict, node:test
- Env vars: DATABASE_URL
- Related tests: apps/worker/src/runtime.integration.test.ts
