# packages/logger/src/otel.ts

## Purpose
- Executable source under packages. Declares exports such as addActiveSpanEvent, getActiveTraceContext, recordActiveSpanException, setActiveSpanAttributes, withActiveSpan.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: @opentelemetry/api, node:module, node:path
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
- Top level: packages
- Size: 3230 bytes
- SHA-256: 05fba3c23f0b3174f5f35045379dd45b7fd0899bc3052390e6b081ae39b94573
- Direct imports/refs: @opentelemetry/api, node:module, node:path
- Env vars: none
- Related tests: none
