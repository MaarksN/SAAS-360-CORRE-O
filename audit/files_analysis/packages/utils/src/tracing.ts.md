# packages/utils/src/tracing.ts

## Purpose
- Executable source under packages. Declares exports such as startTracing.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./logger, @opentelemetry/auto-instrumentations-node, @opentelemetry/sdk-node, @opentelemetry/sdk-trace-node
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
- Size: 725 bytes
- SHA-256: 7a99acee3d0106defcef835cc1d6e366085f9cfe2a8053b03508b5da6231467c
- Direct imports/refs: ./logger, @opentelemetry/auto-instrumentations-node, @opentelemetry/sdk-node, @opentelemetry/sdk-trace-node
- Env vars: none
- Related tests: none
