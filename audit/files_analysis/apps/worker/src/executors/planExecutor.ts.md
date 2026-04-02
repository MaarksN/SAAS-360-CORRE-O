# apps/worker/src/executors/planExecutor.ts

## Purpose
- Executable source under apps. Declares exports such as AgentExecutionRequest, PlanBuilder, PlanExecutionResult, PlanExecutionStep, PlanExecutor, +2 more.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./planExecutor.defaults.js, @birthub/agents-core/tools, @birthub/logger, ioredis
- Env vars: none
- Related tests: apps/worker/src/planExecutor.test.ts

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
- Size: 13443 bytes
- SHA-256: 4534160abae8cd3538dc663c1adc31644c907184179267d21db217bd7ee46128
- Direct imports/refs: ./planExecutor.defaults.js, @birthub/agents-core/tools, @birthub/logger, ioredis
- Env vars: none
- Related tests: apps/worker/src/planExecutor.test.ts
