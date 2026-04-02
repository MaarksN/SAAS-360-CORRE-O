# apps/api/src/modules/webhooks/stripe.webhook.shared.ts

## Purpose
- Executable source under apps. Declares exports such as BILLING_WEBHOOK_IDEMPOTENCY_TTL_SECONDS, StripeWebhookEventProcessor, billingStatusCacheKey, constructStripeEvent, createReceivedBillingEvent, +5 more.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/prisma-json.js, ../../lib/problem-details.js, ../../lib/redis.js, ../billing/service.js, @birthub/config, @birthub/database, @birthub/logger, express, +2 more
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
- Size: 7785 bytes
- SHA-256: 38c6dde78205469d9605fd73fd40e0616b2f4ca7da57ec2ea01714727def923c
- Direct imports/refs: ../../lib/prisma-json.js, ../../lib/problem-details.js, ../../lib/redis.js, ../billing/service.js, @birthub/config, @birthub/database, @birthub/logger, express, +2 more
- Env vars: none
- Related tests: none
