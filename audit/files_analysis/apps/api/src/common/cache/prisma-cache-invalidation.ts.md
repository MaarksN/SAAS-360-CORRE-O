# apps/api/src/common/cache/prisma-cache-invalidation.ts

## Purpose
- Executable source under apps. Declares exports such as registerTenantCacheInvalidationMiddleware.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ./tenant-cache.js, @birthub/database
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
- Size: 4263 bytes
- SHA-256: f52710b71165a0ef128cac7d8c021cc75c1771c5d6749847fe345051f71c10cf
- Direct imports/refs: ./tenant-cache.js, @birthub/database
- Env vars: none
- Related tests: none
