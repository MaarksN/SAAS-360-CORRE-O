# apps/api/src/common/cache/tenant-cache.ts

## Purpose
- Executable source under apps. Declares exports such as CachedTenant, cacheTenant, getCachedTenant, invalidateTenantCache.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ./cache-store.js, @birthub/database
- Env vars: none
- Related tests: apps/api/test/tenant-cache.hit-miss.test.ts

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
- Size: 1970 bytes
- SHA-256: 810048d7729e9fd1d324e3225beb887700b3468d193a5bbcfa2057f10ca62efd
- Direct imports/refs: ./cache-store.js, @birthub/database
- Env vars: none
- Related tests: apps/api/test/tenant-cache.hit-miss.test.ts
