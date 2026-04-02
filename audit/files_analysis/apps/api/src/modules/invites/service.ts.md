# apps/api/src/modules/invites/service.ts

## Purpose
- Executable source under apps. Declares exports such as acceptInvite, cleanupExpiredInvites, createInvite, listInvites, revokeInvite.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/problem-details.js, @birthub/database, @birthub/logger, node:crypto
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
- Top level: apps
- Size: 4941 bytes
- SHA-256: 8d0c858916e173eedc8e5011a391c8225a12305a0758e54fc921b11561d093ba
- Direct imports/refs: ../../lib/problem-details.js, @birthub/database, @birthub/logger, node:crypto
- Env vars: none
- Related tests: apps/api/tests/metrics.service.test.ts, packages/conversation-core/src/__tests__/service.test.ts
