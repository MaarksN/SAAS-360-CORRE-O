# apps/worker/src/agents/conversations.ts

## Purpose
- Executable source under apps. Declares exports such as createConversationMessage, ensureConversationThread.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: @birthub/database
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
- Size: 4189 bytes
- SHA-256: b8ea94ff0b16471c0b8b11501086c3462f619eea2d035ad577b9638af84ddb2c
- Direct imports/refs: @birthub/database
- Env vars: none
- Related tests: none
