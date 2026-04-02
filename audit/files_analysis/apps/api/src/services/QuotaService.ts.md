# apps/api/src/services/QuotaService.ts

## Purpose
- Executable source under apps. Declares exports such as QuotaService.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../modules/billing/plan.utils.js, ../modules/billing/service.js, @birthub/database
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
- Size: 4223 bytes
- SHA-256: 4df75baab4011095247d05ddc167133bdf898e301160c217466544b6925e592b
- Direct imports/refs: ../modules/billing/plan.utils.js, ../modules/billing/service.js, @birthub/database
- Env vars: none
- Related tests: none
