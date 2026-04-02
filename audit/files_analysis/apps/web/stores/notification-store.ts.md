# apps/web/stores/notification-store.ts

## Purpose
- Executable source under apps. Declares exports such as NotificationItem, useNotificationStore.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: ../lib/auth-client, zustand
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
- Size: 4795 bytes
- SHA-256: 6d766b88638fdfc9c0d736c3952fabfe5a903137f1bf363b099f354053396163
- Direct imports/refs: ../lib/auth-client, zustand
- Env vars: none
- Related tests: none
