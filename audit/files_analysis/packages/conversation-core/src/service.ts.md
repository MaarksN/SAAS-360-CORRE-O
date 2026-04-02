# packages/conversation-core/src/service.ts

## Purpose
- Executable source under packages. Declares exports such as Conversation, ConversationEvent, ConversationService, Message.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: apps/api/tests/metrics.service.test.ts, packages/conversation-core/src/__tests__/service.test.ts

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
- Top level: packages
- Size: 2527 bytes
- SHA-256: a29ed1121550eda1cd445c253a2357b17a453d061117c6923948a0fa4f6e275b
- Direct imports/refs: none
- Env vars: none
- Related tests: apps/api/tests/metrics.service.test.ts, packages/conversation-core/src/__tests__/service.test.ts
