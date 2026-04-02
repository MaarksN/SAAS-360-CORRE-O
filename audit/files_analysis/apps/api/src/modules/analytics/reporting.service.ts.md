# apps/api/src/modules/analytics/reporting.service.ts

## Purpose
- Executable source under apps. Declares exports such as exportBillingCsv, getCohortMetrics, getCsRiskAccounts, getExecutiveMetrics, getGlobalAgentPerformance, +1 more.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ./analytics.types.js, ./analytics.utils.js, @birthub/database
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
- Size: 6766 bytes
- SHA-256: 68b3245cbc889e153723c23ce741a91e42e6767ff7f17fbfef63f332847e836e
- Direct imports/refs: ./analytics.types.js, ./analytics.utils.js, @birthub/database
- Env vars: none
- Related tests: none
