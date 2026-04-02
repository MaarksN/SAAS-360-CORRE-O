# agents/marketing/worker.py

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
- Size: 1068 bytes
- SHA-256: dddf94a1d706ca0d9c02c9dde2f33c3e1c296a54f2172a5f67d9be00eb113505
- Direct imports/refs: none
- Env vars: none
- Related tests: apps/worker/src/agents/runtime.db-integration.test.ts, apps/worker/src/agents/runtime.shared.test.ts, apps/worker/src/engine/runner.agent.smoke.test.ts, apps/worker/src/engine/runner.cancel.test.ts, apps/worker/src/engine/runner.db-integration.test.ts, apps/worker/src/engine/runner.http.msw.test.ts, apps/worker/src/engine/runner.transitions.test.ts, apps/worker/src/engine/runner.workflow-chain.test.ts
