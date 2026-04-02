# apps/worker/src/agents/runtime.telemetry.ts

## Purpose
- Executable source under apps. Declares exports such as appendConversationMessage, buildLearningRecord, createOutputArtifact, querySharedLearning.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./conversations.js, ./runtime.memory.js, @birthub/agents-core, @birthub/database, node:crypto
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
- Size: 4917 bytes
- SHA-256: 2338c5363e45c1e7617c905f37e1f6467d12a6aeaeee0139610daa183ca90c1f
- Direct imports/refs: ./conversations.js, ./runtime.memory.js, @birthub/agents-core, @birthub/database, node:crypto
- Env vars: none
- Related tests: none
