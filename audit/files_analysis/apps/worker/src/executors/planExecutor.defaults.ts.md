# apps/worker/src/executors/planExecutor.defaults.ts

## Purpose
- Executable source under apps. Declares exports such as MockPlanBuilder, buildExecutionDigest, createDefaultTools, createExecutorError, jitter, +1 more.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./planExecutor.js, @birthub/agents-core/policy/engine, @birthub/agents-core/tools, @birthub/logger, node:crypto
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
- Size: 2768 bytes
- SHA-256: d3cee8a3fb09b97ee41e204cf156ddbc889aec343ac861a4aa2ac566c2ce3ab8
- Direct imports/refs: ./planExecutor.js, @birthub/agents-core/policy/engine, @birthub/agents-core/tools, @birthub/logger, node:crypto
- Env vars: none
- Related tests: none
