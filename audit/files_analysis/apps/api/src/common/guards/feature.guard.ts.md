# apps/api/src/common/guards/feature.guard.ts

## Purpose
- Executable source under apps. Declares exports such as RequireFeature.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/problem-details.js, ../../modules/billing/plan.utils.js, ../../modules/billing/service.js, express
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
- Size: 2034 bytes
- SHA-256: a7d12604c008e208fa89af16495747c8ec19e1747868cfb1cc30aa373316171f
- Direct imports/refs: ../../lib/problem-details.js, ../../modules/billing/plan.utils.js, ../../modules/billing/service.js, express
- Env vars: none
- Related tests: none
