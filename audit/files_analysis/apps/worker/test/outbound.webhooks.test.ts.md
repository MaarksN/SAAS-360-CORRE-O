# apps/worker/test/outbound.webhooks.test.ts

## Purpose
- Automated verification asset for runtime or package behavior.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ../src/webhooks/outbound.js, @birthub/database, bullmq, node:assert/strict, node:test
- Env vars: DATABASE_URL, REDIS_URL
- Related tests: apps/worker/test/outbound.webhooks.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- No heuristic issues were triggered by the static scan.

## Risk Score
- 5/100

## Status
- OK

## Evidence
- Kind: test
- Language: TypeScript
- Top level: apps
- Size: 13108 bytes
- SHA-256: cde26cee0941cac67f555032c6810bb406d552eb09e88c118a4162051e636f6f
- Direct imports/refs: ../src/webhooks/outbound.js, @birthub/database, bullmq, node:assert/strict, node:test
- Env vars: DATABASE_URL, REDIS_URL
- Related tests: apps/worker/test/outbound.webhooks.test.ts
