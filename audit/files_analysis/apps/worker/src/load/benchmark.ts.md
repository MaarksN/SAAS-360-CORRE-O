# apps/worker/src/load/benchmark.ts

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./parallelLoad.js, @birthub/logger
- Env vars: none
- Related tests: apps/api/test/benchmarks/pack-installer.benchmark.ts

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
- Size: 835 bytes
- SHA-256: 925f5d5936974812234f1f10f61e3096ba2ae9daf4069990169ef04f2092a8ae
- Direct imports/refs: ./parallelLoad.js, @birthub/logger
- Env vars: none
- Related tests: apps/api/test/benchmarks/pack-installer.benchmark.ts
