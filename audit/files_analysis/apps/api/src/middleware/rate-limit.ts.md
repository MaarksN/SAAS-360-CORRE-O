# apps/api/src/middleware/rate-limit.ts

## Purpose
- Executable source under apps. Declares exports such as createLoginRateLimitMiddleware, createRateLimitMiddleware, createWebhookRateLimitMiddleware.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../lib/problem-details.js, ../lib/redis.js, @birthub/config, @birthub/database, @birthub/logger, express, ioredis
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
- Size: 11658 bytes
- SHA-256: 6dd491299262a1506bdad78379e08db5573ecf64d73f1d5961121b4ef15d60d5
- Direct imports/refs: ../lib/problem-details.js, ../lib/redis.js, @birthub/config, @birthub/database, @birthub/logger, express, ioredis
- Env vars: none
- Related tests: none
