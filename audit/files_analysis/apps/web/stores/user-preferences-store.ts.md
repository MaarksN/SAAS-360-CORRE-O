# apps/web/stores/user-preferences-store.ts

## Purpose
- Executable source under apps. Declares exports such as CookieConsentStatus, UserNotificationPreferences, useUserPreferencesStore.

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
- Size: 3556 bytes
- SHA-256: 21e501491ccb35a71838dfec3f93e374c944e10be39e1a6efac369ba9a1a87d4
- Direct imports/refs: ../lib/auth-client, zustand
- Env vars: none
- Related tests: none
