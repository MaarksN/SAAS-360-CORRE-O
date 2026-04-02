# apps/worker/src/agents/handoffs.ts

## Purpose
- Executable source under apps. Declares exports such as persistAgentHandoff.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./conversations.js, @birthub/database
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
- Size: 2499 bytes
- SHA-256: 2b8f826c937e5d42d88fa9fbe9aa3919806b490dc30ef5a2200ed7a37a1f4807
- Direct imports/refs: ./conversations.js, @birthub/database
- Env vars: none
- Related tests: none
