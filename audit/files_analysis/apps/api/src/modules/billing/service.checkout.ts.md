# apps/api/src/modules/billing/service.checkout.ts

## Purpose
- Executable source under apps. Declares exports such as cancelBillingForOrganization, createCheckoutSessionForOrganization, createCustomerPortalSessionForOrganization, listActivePlans, listInvoicesForOrganization, +2 more.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/problem-details.js, ./service.shared.js, ./stripe.client.js, @birthub/config, @birthub/database, @birthub/logger, stripe
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
- Size: 11463 bytes
- SHA-256: 3bef3fd4a6111ee4627cc5dd4815fc4c8c20e58fbb69587ac8a9c5ffdda71c1d
- Direct imports/refs: ../../lib/problem-details.js, ./service.shared.js, ./stripe.client.js, @birthub/config, @birthub/database, @birthub/logger, stripe
- Env vars: none
- Related tests: none
