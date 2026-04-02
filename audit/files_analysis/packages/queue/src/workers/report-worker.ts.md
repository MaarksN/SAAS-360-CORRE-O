# packages/queue/src/workers/report-worker.ts

## Purpose
- Executable source under packages. Declares exports such as ReportJobPayload, ReportWorker.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./base-worker
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 42/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 356 bytes
- SHA-256: 7ac14e839806b617d8355ea44cfa0864ef79e9b3fd72061cb792d9260ae91afd
- Direct imports/refs: ./base-worker
- Env vars: none
- Related tests: none
