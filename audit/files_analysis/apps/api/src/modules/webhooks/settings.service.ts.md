# apps/api/src/modules/webhooks/settings.service.ts

## Purpose
- Executable source under apps. Declares exports such as createTenantWebhookEndpoint, listTenantWebhookDeliveries, listTenantWebhookEndpoints, retryWebhookDelivery, updateTenantWebhookEndpoint.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/problem-details.js, ../engagement/queues.js, @birthub/config, @birthub/database, node:crypto
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
- Size: 4051 bytes
- SHA-256: d4ae48304e8e6e4f72dfc233410c552441aa601cda4484c8ae4cec78c827bbcb
- Direct imports/refs: ../../lib/problem-details.js, ../engagement/queues.js, @birthub/config, @birthub/database, node:crypto
- Env vars: none
- Related tests: none
