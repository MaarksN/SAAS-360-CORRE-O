# apps/api/src/modules/dashboard/service.ts

## Purpose
- Executable source under apps. Declares exports such as getDashboardAgentStatuses, getDashboardBillingSummary, getDashboardMetrics, getDashboardRecentTasks.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../billing/service.js, @birthub/database
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
- Size: 12230 bytes
- SHA-256: c4e00a95b6b8f626176044980cdb4222c83d3d8981bffaacfb45c489b2f49375
- Direct imports/refs: ../billing/service.js, @birthub/database
- Env vars: none
- Related tests: apps/api/tests/metrics.service.test.ts, packages/conversation-core/src/__tests__/service.test.ts
