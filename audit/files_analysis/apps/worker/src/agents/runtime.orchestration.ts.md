# apps/worker/src/agents/runtime.orchestration.ts

## Purpose
- Executable source under apps. Declares exports such as executeManifestAgentRuntime.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ../executors/planExecutor.js, ./runtime.budget.js, ./runtime.catalog.js, ./runtime.memory.js, ./runtime.shared.js, ./runtime.telemetry.js, ./runtime.tools.js, ./runtime.types.js, +4 more
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
- Size: 7853 bytes
- SHA-256: 3740a62ee816ba1043b2f70ba0297026a836caa9ed48142bc5842dbcaf50cd6f
- Direct imports/refs: ../executors/planExecutor.js, ./runtime.budget.js, ./runtime.catalog.js, ./runtime.memory.js, ./runtime.shared.js, ./runtime.telemetry.js, ./runtime.tools.js, ./runtime.types.js, +4 more
- Env vars: none
- Related tests: none
