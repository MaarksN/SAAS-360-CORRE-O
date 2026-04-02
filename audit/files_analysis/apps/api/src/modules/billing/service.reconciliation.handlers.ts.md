# apps/api/src/modules/billing/service.reconciliation.handlers.ts

## Purpose
- Executable source under apps. Declares exports such as handleCheckoutSessionCompleted, handleCustomerSubscriptionDeleted, handleCustomerSubscriptionUpdated, handleInvoicePaymentFailed, handleInvoicePaymentSucceeded.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/problem-details.js, ./service.reconciliation.shared.js, ./service.shared.js, @birthub/config, @birthub/database, stripe
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 30/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 12440 bytes
- SHA-256: de778a06c90cc74e97381432c804398df7513babf48c55a44ac272513a6ff607
- Direct imports/refs: ../../lib/problem-details.js, ./service.reconciliation.shared.js, ./service.shared.js, @birthub/config, @birthub/database, stripe
- Env vars: none
- Related tests: none
