# apps/api/src/metrics.ts

## Purpose
- Executable source under apps. Declares exports such as metricsHandler, metricsMiddleware, recordBillingProcessedMetric, recordTenantJobMetric, recordWebVitalMetric, +1 more.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: @birthub/database, @birthub/logger, express, node:perf_hooks
- Env vars: none
- Related tests: apps/api/tests/metrics.service.test.ts, packages/logger/src/metrics.test.ts

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
- Size: 5010 bytes
- SHA-256: 52f48b058c3bb58be112d7c006fb7a4df845e690f57c90ee69f8ff787067c04c
- Direct imports/refs: @birthub/database, @birthub/logger, express, node:perf_hooks
- Env vars: none
- Related tests: apps/api/tests/metrics.service.test.ts, packages/logger/src/metrics.test.ts
