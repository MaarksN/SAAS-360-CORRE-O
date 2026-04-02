# apps/api/src/modules/billing/service.reconciliation.ts

## Purpose
- Executable source under apps. Declares exports such as processStripeBillingEvent.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ./service.reconciliation.handlers.js, ./service.reconciliation.shared.js, ./service.shared.js, @birthub/config, @birthub/database, stripe
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
- Size: 1944 bytes
- SHA-256: 67bbeb10df78aea8dcec1bde6b33236faa82c7e3e119765cc18a4c83e9a752c2
- Direct imports/refs: ./service.reconciliation.handlers.js, ./service.reconciliation.shared.js, ./service.shared.js, @birthub/config, @birthub/database, stripe
- Env vars: none
- Related tests: none
