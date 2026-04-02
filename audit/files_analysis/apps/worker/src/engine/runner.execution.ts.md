# apps/worker/src/engine/runner.execution.ts

## Purpose
- Executable source under apps. Declares exports such as ExecutionContext, WorkflowExecutionQueue, processWorkflowExecutionJob.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./runner.execution.outcomes.js, ./runner.js, ./runner.shared.js, @birthub/database, @birthub/workflows-core, bullmq, node:crypto
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
- Size: 7519 bytes
- SHA-256: 93a3d4f2ea64dfa8197bc1ebb60407a41b565e30b09edfff7dc92eb91bd9212a
- Direct imports/refs: ./runner.execution.outcomes.js, ./runner.js, ./runner.shared.js, @birthub/database, @birthub/workflows-core, bullmq, node:crypto
- Env vars: none
- Related tests: none
