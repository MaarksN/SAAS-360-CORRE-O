# apps/worker/src/observability/otel.ts

## Purpose
- Executable source under apps. Declares exports such as initializeWorkerOpenTelemetry, shutdownWorkerOpenTelemetry.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: @birthub/logger, node:module
- Env vars: OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_SERVICE_NAME
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- direct_env_access: Reads environment variables directly outside the shared config surface.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 40/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 4432 bytes
- SHA-256: 2d8e45f5dbc14096dbad743cd13f2a87704b8b026093a52e53760577a4f58610
- Direct imports/refs: @birthub/logger, node:module
- Env vars: OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_SERVICE_NAME
- Related tests: none
