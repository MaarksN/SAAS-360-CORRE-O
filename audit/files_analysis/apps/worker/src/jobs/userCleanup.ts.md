# apps/worker/src/jobs/userCleanup.ts

## Purpose
- Executable source under apps. Declares exports such as cleanupSuspendedUsers.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: @birthub/database, node:crypto
- Env vars: none
- Related tests: apps/worker/test/userCleanup.test.ts

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
- Size: 1075 bytes
- SHA-256: a34df34e14143b2368cb896fdb5552a078a3ab71d152d10406f927c50cc8a74b
- Direct imports/refs: @birthub/database, node:crypto
- Env vars: none
- Related tests: apps/worker/test/userCleanup.test.ts
