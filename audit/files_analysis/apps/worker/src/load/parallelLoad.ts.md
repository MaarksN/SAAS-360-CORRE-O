# apps/worker/src/load/parallelLoad.ts

## Purpose
- Executable source under apps. Declares exports such as ParallelLoadMetrics, runParallelExecutionLoadTest.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ../executors/planExecutor.js, @birthub/agents-core/tools, node:perf_hooks, p-map, zod
- Env vars: none
- Related tests: apps/worker/src/load/parallelLoad.test.ts

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
- Size: 3352 bytes
- SHA-256: f8f2be5b7eab87dbe0fe005bb047ab1c5bc778146e2c5009c7e5f8bbd0738691
- Direct imports/refs: ../executors/planExecutor.js, @birthub/agents-core/tools, node:perf_hooks, p-map, zod
- Env vars: none
- Related tests: apps/worker/src/load/parallelLoad.test.ts
