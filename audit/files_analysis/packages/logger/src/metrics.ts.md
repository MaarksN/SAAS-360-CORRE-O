# packages/logger/src/metrics.ts

## Purpose
- Executable source under packages. Declares exports such as DEFAULT_DURATION_BUCKETS_MS, GlobalMetricsRegistry, MetricLabelValue, MetricLabels, MetricsRegistry, +6 more.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: none
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
- Top level: packages
- Size: 7268 bytes
- SHA-256: 605624c63e690b4c5a201028132ff32e8d898d26399e82e4b8a05ec16a4926ee
- Direct imports/refs: none
- Env vars: none
- Related tests: apps/api/tests/metrics.service.test.ts, packages/logger/src/metrics.test.ts
