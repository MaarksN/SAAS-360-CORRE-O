# apps/worker/src/engine/runner.ts

## Purpose
- Executable source under apps. Declares exports such as WorkflowExecutionJobPayload, WorkflowRunner, WorkflowRunnerDependencies, WorkflowTriggerJobPayload, createWorkflowExecutionQueue, +1 more.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./runner.execution.js, ./runner.shared.js, @birthub/database, @birthub/workflows-core, bullmq
- Env vars: none
- Related tests: apps/worker/src/engine/runner.agent.smoke.test.ts, apps/worker/src/engine/runner.cancel.test.ts, apps/worker/src/engine/runner.db-integration.test.ts, apps/worker/src/engine/runner.http.msw.test.ts, apps/worker/src/engine/runner.transitions.test.ts, apps/worker/src/engine/runner.workflow-chain.test.ts

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
- Size: 4022 bytes
- SHA-256: 25ab3b8d6f7b47ea22b9bd119450cc16df4b570cd916cc5d29600d2d94588e49
- Direct imports/refs: ./runner.execution.js, ./runner.shared.js, @birthub/database, @birthub/workflows-core, bullmq
- Env vars: none
- Related tests: apps/worker/src/engine/runner.agent.smoke.test.ts, apps/worker/src/engine/runner.cancel.test.ts, apps/worker/src/engine/runner.db-integration.test.ts, apps/worker/src/engine/runner.http.msw.test.ts, apps/worker/src/engine/runner.transitions.test.ts, apps/worker/src/engine/runner.workflow-chain.test.ts
