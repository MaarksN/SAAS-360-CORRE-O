# apps/worker/src/worker.ts

## Purpose
- Executable source under apps. Declares exports such as WorkerRuntime, createBirthHubWorker.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./agents/handoffs.js, ./agents/runtime.js, ./engine/runner.js, ./integrations/connectors.runtime.js, ./integrations/hubspot.js, ./lib/rate-limiter.js, ./notifications/emailQueue.js, ./queues/agentQueue.js, +10 more
- Env vars: none
- Related tests: apps/worker/src/agents/runtime.db-integration.test.ts, apps/worker/src/agents/runtime.shared.test.ts, apps/worker/src/engine/runner.agent.smoke.test.ts, apps/worker/src/engine/runner.cancel.test.ts, apps/worker/src/engine/runner.db-integration.test.ts, apps/worker/src/engine/runner.http.msw.test.ts, apps/worker/src/engine/runner.transitions.test.ts, apps/worker/src/engine/runner.workflow-chain.test.ts

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
- Size: 12301 bytes
- SHA-256: 5cf5d8808c2683d91d52573646bcf8cd5235e1da57bdd8e0dbfda621b135a17a
- Direct imports/refs: ./agents/handoffs.js, ./agents/runtime.js, ./engine/runner.js, ./integrations/connectors.runtime.js, ./integrations/hubspot.js, ./lib/rate-limiter.js, ./notifications/emailQueue.js, ./queues/agentQueue.js, +10 more
- Env vars: none
- Related tests: apps/worker/src/agents/runtime.db-integration.test.ts, apps/worker/src/agents/runtime.shared.test.ts, apps/worker/src/engine/runner.agent.smoke.test.ts, apps/worker/src/engine/runner.cancel.test.ts, apps/worker/src/engine/runner.db-integration.test.ts, apps/worker/src/engine/runner.http.msw.test.ts, apps/worker/src/engine/runner.transitions.test.ts, apps/worker/src/engine/runner.workflow-chain.test.ts
