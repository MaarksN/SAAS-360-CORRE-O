# apps/api/src/modules/notifications/service.ts

## Purpose
- Executable source under apps. Declares exports such as getNotificationFeed, getNotificationPreferences, markAllNotificationsReadForUser, markNotificationReadForUser, saveNotificationPreferences.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/problem-details.js, @birthub/database
- Env vars: none
- Related tests: apps/api/tests/metrics.service.test.ts, packages/conversation-core/src/__tests__/service.test.ts

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
- Size: 3237 bytes
- SHA-256: a320fc0b31f67144e6495442e5d20a32bf4e09c2ecb2179110bfbdbbb1b3aacb
- Direct imports/refs: ../../lib/problem-details.js, @birthub/database
- Env vars: none
- Related tests: apps/api/tests/metrics.service.test.ts, packages/conversation-core/src/__tests__/service.test.ts
