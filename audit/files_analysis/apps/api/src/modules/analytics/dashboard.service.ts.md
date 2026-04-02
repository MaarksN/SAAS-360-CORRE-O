# apps/api/src/modules/analytics/dashboard.service.ts

## Purpose
- Executable source under apps. Declares exports such as getMasterAdminDashboard, getOperationsDashboard.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../agents/metrics.service.js, ../agents/queue.js, ./analytics.utils.js, @birthub/config, @birthub/database
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
- Size: 5177 bytes
- SHA-256: 68718f842878feee6ba394e0d6ead8a5e9ec801063e47acc0bbd38f55151f8a5
- Direct imports/refs: ../agents/metrics.service.js, ../agents/queue.js, ./analytics.utils.js, @birthub/config, @birthub/database
- Env vars: none
- Related tests: none
