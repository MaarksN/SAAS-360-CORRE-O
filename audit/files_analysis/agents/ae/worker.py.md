# agents/ae/worker.py

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
- Size: 1019 bytes
- SHA-256: 034ed411e7a8849dd7ea6d3fe0748088d6423e902d039da103cfb3ea4eea18ef
- Direct imports/refs: none
- Env vars: none
- Related tests: apps/worker/src/agents/runtime.db-integration.test.ts, apps/worker/src/agents/runtime.shared.test.ts, apps/worker/src/engine/runner.agent.smoke.test.ts, apps/worker/src/engine/runner.cancel.test.ts, apps/worker/src/engine/runner.db-integration.test.ts, apps/worker/src/engine/runner.http.msw.test.ts, apps/worker/src/engine/runner.transitions.test.ts, apps/worker/src/engine/runner.workflow-chain.test.ts
