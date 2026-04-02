# apps/worker/src/metrics.ts

## Purpose
- Executable source under apps. Declares exports such as updateWorkerQueueDepth, workerQueueGauge.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: node:module
- Env vars: OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_SERVICE_NAME
- Related tests: apps/api/tests/metrics.service.test.ts, packages/logger/src/metrics.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- direct_env_access: Reads environment variables directly outside the shared config surface.
- queue_guardrails_missing: Queue usage appears without obvious retry/retention/backpressure controls in the same file.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 72/100

## Status
- CRITICO

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 2723 bytes
- SHA-256: aca48c157a1bb1a59083c49851f25163087ed6e83a20b2878735c319f4a7bc7f
- Direct imports/refs: node:module
- Env vars: OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_SERVICE_NAME
- Related tests: apps/api/tests/metrics.service.test.ts, packages/logger/src/metrics.test.ts
