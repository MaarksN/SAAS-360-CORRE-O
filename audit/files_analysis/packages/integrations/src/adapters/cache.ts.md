# packages/integrations/src/adapters/cache.ts

## Purpose
- Executable source under packages. Declares exports such as getCached, setCached.

## Architectural Role
- Shared package surface used across the monorepo.

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
- Top level: packages
- Size: 496 bytes
- SHA-256: d942b3ec6d8e3d824468562755ecf4ab7ac0af8a629acd9cb5b3b36114ff47f2
- Direct imports/refs: none
- Env vars: none
- Related tests: apps/api/test/cache.isolation.test.ts, apps/api/test/tenant-cache.hit-miss.test.ts, apps/api/tests/billing.cache.test.ts
