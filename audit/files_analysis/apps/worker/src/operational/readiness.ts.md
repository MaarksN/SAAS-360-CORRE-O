# apps/worker/src/operational/readiness.ts

## Purpose
- Executable source under apps. Declares exports such as WorkerQueueState, WorkerReadinessResponse, evaluateWorkerReadiness.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: apps/worker/test/readiness.required-dependency.test.ts, packages/agent-packs/test/github-collection-readiness.test.ts

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
- Size: 1852 bytes
- SHA-256: c5eb00d262383c859883dd3fae3db45f2817c84b1447fdecee07795e804c8af9
- Direct imports/refs: none
- Env vars: none
- Related tests: apps/worker/test/readiness.required-dependency.test.ts, packages/agent-packs/test/github-collection-readiness.test.ts
