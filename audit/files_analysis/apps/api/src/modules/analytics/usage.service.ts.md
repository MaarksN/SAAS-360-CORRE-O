# apps/api/src/modules/analytics/usage.service.ts

## Purpose
- Executable source under apps. Declares exports such as getActiveTenantsMetrics, getUsageMetrics.

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
- Size: 1778 bytes
- SHA-256: 1ca15a7bde729a2626f875467f6045e3bf1fc055915ab3e694387dff0fd5aa4a
- Direct imports/refs: ./analytics.types.js, ./analytics.utils.js, @birthub/database
- Env vars: none
- Related tests: none
