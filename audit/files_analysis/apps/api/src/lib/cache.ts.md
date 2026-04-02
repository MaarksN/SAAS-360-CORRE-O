# apps/api/src/lib/cache.ts

## Purpose
- Executable source under apps. Declares exports such as buildTenantCacheKey.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: apps/api/test/cache.isolation.test.ts, apps/api/test/tenant-cache.hit-miss.test.ts, apps/api/tests/billing.cache.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- No heuristic issues were triggered by the static scan.

## Risk Score
- 15/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 185 bytes
- SHA-256: f995ed8111542d573380600eaff0f5326825658a939eb8ab0f38b9d3b6a22c75
- Direct imports/refs: none
- Env vars: none
- Related tests: apps/api/test/cache.isolation.test.ts, apps/api/test/tenant-cache.hit-miss.test.ts, apps/api/tests/billing.cache.test.ts
