# apps/api/src/modules/billing/service.snapshot.ts

## Purpose
- Executable source under apps. Declares exports such as canUseFeature, clearCheckoutIpBan, getAgentLimitForOrganization, getBillingSnapshot, invalidateBillingSnapshotCache, +2 more.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../common/cache/cache-store.js, ../../lib/problem-details.js, ./plan.utils.js, ./service.shared.js, @birthub/config, @birthub/database
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
- Size: 8457 bytes
- SHA-256: 0722375d4d0b7f5814875b971a4801300048ab390adf87dbf0571d61f3a8f952
- Direct imports/refs: ../../common/cache/cache-store.js, ../../lib/problem-details.js, ./plan.utils.js, ./service.shared.js, @birthub/config, @birthub/database
- Env vars: none
- Related tests: none
