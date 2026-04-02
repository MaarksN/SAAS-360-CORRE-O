# apps/api/src/observability/otel.ts

## Purpose
- Executable source under apps. Declares exports such as annotateTenantSpan, flagTenantForFullSampling, initializeOpenTelemetry, shouldForceTenantSampling, shutdownOpenTelemetry.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: @birthub/config, @birthub/logger, node:module
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 30/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 6357 bytes
- SHA-256: 0f70e6abff176aef8fb8b69c61819995271f21193d3e12d5cbe904fc4d8eb0dd
- Direct imports/refs: @birthub/config, @birthub/logger, node:module
- Env vars: none
- Related tests: none
