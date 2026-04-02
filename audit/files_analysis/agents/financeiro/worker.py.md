# agents/financeiro/worker.py

## Purpose
- Executable source under agents. No explicit named exports detected.

## Architectural Role
- Agent-specific runtime or support module.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: apps/worker/src/agents/runtime.db-integration.test.ts, apps/worker/src/agents/runtime.shared.test.ts, apps/worker/src/engine/runner.agent.smoke.test.ts, apps/worker/src/engine/runner.cancel.test.ts, apps/worker/src/engine/runner.db-integration.test.ts, apps/worker/src/engine/runner.http.msw.test.ts, apps/worker/src/engine/runner.transitions.test.ts, apps/worker/src/engine/runner.workflow-chain.test.ts

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
- Language: Python
- Top level: agents
- Size: 1075 bytes
- SHA-256: 4cc7bd829b1786f6f88b6b46490798256394c710f3ec1cce0b0d66645f5b2eb2
- Direct imports/refs: none
- Env vars: none
- Related tests: apps/worker/src/agents/runtime.db-integration.test.ts, apps/worker/src/agents/runtime.shared.test.ts, apps/worker/src/engine/runner.agent.smoke.test.ts, apps/worker/src/engine/runner.cancel.test.ts, apps/worker/src/engine/runner.db-integration.test.ts, apps/worker/src/engine/runner.http.msw.test.ts, apps/worker/src/engine/runner.transitions.test.ts, apps/worker/src/engine/runner.workflow-chain.test.ts
