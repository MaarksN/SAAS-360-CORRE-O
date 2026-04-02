# apps/worker/src/agents/runtime.ts

## Purpose
- Executable source under apps. Declares exports such as executeManifestAgentRuntime.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ../executors/planExecutor.js, ./runtime.artifacts.js, ./runtime.budget.js, ./runtime.memory.js, ./runtime.resolution.js, ./runtime.shared.js, ./runtime.tools.js, ./runtime.types.js, +4 more
- Env vars: none
- Related tests: apps/worker/src/agents/runtime.db-integration.test.ts, apps/worker/src/agents/runtime.shared.test.ts, apps/worker/src/runtime.integration.test.ts, packages/agent-runtime/src/__tests__/runtime.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 27/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 7904 bytes
- SHA-256: 255627e8f699dd339628729f2ddbc419b41dd3558bb7aae7f400a0ac039a36a1
- Direct imports/refs: ../executors/planExecutor.js, ./runtime.artifacts.js, ./runtime.budget.js, ./runtime.memory.js, ./runtime.resolution.js, ./runtime.shared.js, ./runtime.tools.js, ./runtime.types.js, +4 more
- Env vars: none
- Related tests: apps/worker/src/agents/runtime.db-integration.test.ts, apps/worker/src/agents/runtime.shared.test.ts, apps/worker/src/runtime.integration.test.ts, packages/agent-runtime/src/__tests__/runtime.test.ts
