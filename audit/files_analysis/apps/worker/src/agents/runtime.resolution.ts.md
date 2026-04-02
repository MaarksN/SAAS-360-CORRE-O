# apps/worker/src/agents/runtime.resolution.ts

## Purpose
- Executable source under apps. Declares exports such as resolveManagedPolicies, resolveRuntimeAgent.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./runtime.shared.js, ./runtime.types.js, @birthub/agents-core, @birthub/database
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
- Size: 1706 bytes
- SHA-256: f8514a558cf2dbe8f5c50b3d087d884f766b6a101626a40b57823716e7989db3
- Direct imports/refs: ./runtime.shared.js, ./runtime.types.js, @birthub/agents-core, @birthub/database
- Env vars: none
- Related tests: none
