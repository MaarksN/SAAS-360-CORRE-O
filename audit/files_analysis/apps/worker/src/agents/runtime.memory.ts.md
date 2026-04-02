# apps/worker/src/agents/runtime.memory.ts

## Purpose
- Executable source under apps. Declares exports such as appendConversationMessage, querySharedLearning, runtimeMemory.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./conversations.js, ./runtime.shared.js, @birthub/agents-core, @birthub/database
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
- Size: 6014 bytes
- SHA-256: 2277314e0b5321a48af77b7b3feec004ca5359bf85694c0f77eaf9b68cca10f2
- Direct imports/refs: ./conversations.js, ./runtime.shared.js, @birthub/agents-core, @birthub/database
- Env vars: none
- Related tests: none
