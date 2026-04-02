# packages/database/src/repositories/engagement.ts

## Purpose
- Executable source under packages. Declares exports such as createNotificationForOrganizationRoles, createNotificationForUser, ensureUserPreference, getUserPreference, listNotifications, +3 more.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../client.js, @prisma/client
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
- Top level: packages
- Size: 7071 bytes
- SHA-256: 4d95e5dbd7c43c57150d7d0c7a822b4759176c1d03482559604fc7f0fd915f66
- Direct imports/refs: ../client.js, @prisma/client
- Env vars: none
- Related tests: none
