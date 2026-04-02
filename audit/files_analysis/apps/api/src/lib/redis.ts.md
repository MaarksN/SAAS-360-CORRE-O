# apps/api/src/lib/redis.ts

## Purpose
- Executable source under apps. Declares exports such as getBullConnection, getSharedRedis.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: @birthub/config, bullmq, ioredis
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 50/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 1836 bytes
- SHA-256: 10723cea7089fa5813b5f4e5c61a4f8b91dacc21861f2e2d415290df8f80a7b0
- Direct imports/refs: @birthub/config, bullmq, ioredis
- Env vars: none
- Related tests: none
