# apps/api/src/app.ts

## Purpose
- Executable source under apps. Declares exports such as AppDependencies, createApp.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ./app/auth-and-core-routes.js, ./app/core.js, ./app/module-routes.js, ./lib/health.js, ./lib/queue.js, @birthub/config, express
- Env vars: none
- Related tests: apps/api/test/__mocks__/stripe.ts, apps/api/test/benchmarks/pack-installer.benchmark.ts, apps/api/test/cache.isolation.test.ts, apps/api/test/fuzzing.test.ts, apps/api/test/isolation.e2e.test.ts, apps/api/test/performance.test.ts, apps/api/test/tenant-cache.hit-miss.test.ts, apps/api/tests/analytics.utils.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 27/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 1785 bytes
- SHA-256: c6d54b64bf1e6ad45952ba6bfe297ae5217f2e8f022cfc04579df6d4b9eba5a4
- Direct imports/refs: ./app/auth-and-core-routes.js, ./app/core.js, ./app/module-routes.js, ./lib/health.js, ./lib/queue.js, @birthub/config, express
- Env vars: none
- Related tests: apps/api/test/__mocks__/stripe.ts, apps/api/test/benchmarks/pack-installer.benchmark.ts, apps/api/test/cache.isolation.test.ts, apps/api/test/fuzzing.test.ts, apps/api/test/isolation.e2e.test.ts, apps/api/test/performance.test.ts, apps/api/test/tenant-cache.hit-miss.test.ts, apps/api/tests/analytics.utils.test.ts
