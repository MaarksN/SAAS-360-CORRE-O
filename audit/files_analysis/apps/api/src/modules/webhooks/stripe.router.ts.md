# apps/api/src/modules/webhooks/stripe.router.ts

## Purpose
- Executable source under apps. Declares exports such as StripeWebhookRouterDependencies, createStripeWebhookRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/problem-details.js, ../billing/service.js, ../billing/stripe.client.js, ./stripe.webhook.processing.js, @birthub/config, @birthub/database, express, stripe
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
- Size: 1479 bytes
- SHA-256: 5d50e4836c363585e66560e670330bb50182e431f28a34e416e078c63af3bf8c
- Direct imports/refs: ../../lib/problem-details.js, ../billing/service.js, ../billing/stripe.client.js, ./stripe.webhook.processing.js, @birthub/config, @birthub/database, express, stripe
- Env vars: none
- Related tests: none
