# apps/api/src/modules/organizations/service.ts

## Purpose
- Executable source under apps. Declares exports such as createOrganization, exportAuditLogsCsv, listAuditLogs, listMembersForOrganization, removeMember, +1 more.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/problem-details.js, ../auth/crypto.js, ../billing/service.js, ../engagement/queues.js, @birthub/config, @birthub/database
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
- Size: 10746 bytes
- SHA-256: a335ade09995759bb5b3015c87d63ed38d23f77046d4d661dd514d47d9c9f785
- Direct imports/refs: ../../lib/problem-details.js, ../auth/crypto.js, ../billing/service.js, ../engagement/queues.js, @birthub/config, @birthub/database
- Env vars: none
- Related tests: apps/api/tests/metrics.service.test.ts, packages/conversation-core/src/__tests__/service.test.ts
