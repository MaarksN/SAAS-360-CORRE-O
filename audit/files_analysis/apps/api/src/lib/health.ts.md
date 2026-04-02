# apps/api/src/lib/health.ts

## Purpose
- Executable source under apps. Declares exports such as createDeepHealthService, createHealthService, createReadinessHealthService.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ./queue.js, @birthub/config, @birthub/database
- Env vars: none
- Related tests: apps/api/tests/health.smoke.test.ts, apps/web/tests/health.required-dependency.test.ts, apps/worker/src/jobs/healthScore.test.ts

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
- Size: 5404 bytes
- SHA-256: 9eab5b6c1757afe9585079dad3fb28ee12bbeab2542537719ccbf27d035519a8
- Direct imports/refs: ./queue.js, @birthub/config, @birthub/database
- Env vars: none
- Related tests: apps/api/tests/health.smoke.test.ts, apps/web/tests/health.required-dependency.test.ts, apps/worker/src/jobs/healthScore.test.ts
