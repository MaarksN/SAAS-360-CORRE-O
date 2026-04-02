# apps/worker/src/agents/runtime.shared.ts

## Purpose
- Executable source under apps. Declares exports such as DEFAULT_AGENT_BUDGET_LIMIT_BRL, MINIMUM_APPROVED_LEARNING_CONFIDENCE, SHARED_LEARNING_LIMIT, createRuntimeError, getManifestCatalog, +9 more.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./runtime.types.js, @birthub/agents-core, @birthub/database, node:fs, node:path
- Env vars: none
- Related tests: apps/worker/src/agents/runtime.shared.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- No heuristic issues were triggered by the static scan.

## Risk Score
- 15/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 5598 bytes
- SHA-256: b85a45fbfd112e1ca092737502718948ed26c05e7c67b4f640822488c09d7080
- Direct imports/refs: ./runtime.types.js, @birthub/agents-core, @birthub/database, node:fs, node:path
- Env vars: none
- Related tests: apps/worker/src/agents/runtime.shared.test.ts
