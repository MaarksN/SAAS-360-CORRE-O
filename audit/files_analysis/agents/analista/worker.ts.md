# agents/analista/worker.ts

## Purpose
- Executable source under agents. No explicit named exports detected.

## Architectural Role
- Agent-specific runtime or support module.

## Dependencies
- Imports/refs: @birthub/queue, @birthub/shared-types, axios, bullmq, dotenv
- Env vars: ANALISTA_AGENT_API_URL, INTERNAL_SERVICE_TOKEN
- Related tests: apps/worker/src/agents/runtime.db-integration.test.ts, apps/worker/src/agents/runtime.shared.test.ts, apps/worker/src/engine/runner.agent.smoke.test.ts, apps/worker/src/engine/runner.cancel.test.ts, apps/worker/src/engine/runner.db-integration.test.ts, apps/worker/src/engine/runner.http.msw.test.ts, apps/worker/src/engine/runner.transitions.test.ts, apps/worker/src/engine/runner.workflow-chain.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- any_usage: Contains 1 occurrence(s) of 'any'.
- console_logging: Uses console-based logging 9 time(s) in runtime code.
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- direct_env_access: Reads environment variables directly outside the shared config surface.
- queue_guardrails_missing: Queue usage appears without obvious retry/retention/backpressure controls in the same file.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 100/100

## Status
- CRITICO

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: agents
- Size: 1810 bytes
- SHA-256: 5215d86412c2ff2dae0d29fc4b750c26cc35be32f5475c1e51f7cf53b2db7d38
- Direct imports/refs: @birthub/queue, @birthub/shared-types, axios, bullmq, dotenv
- Env vars: ANALISTA_AGENT_API_URL, INTERNAL_SERVICE_TOKEN
- Related tests: apps/worker/src/agents/runtime.db-integration.test.ts, apps/worker/src/agents/runtime.shared.test.ts, apps/worker/src/engine/runner.agent.smoke.test.ts, apps/worker/src/engine/runner.cancel.test.ts, apps/worker/src/engine/runner.db-integration.test.ts, apps/worker/src/engine/runner.http.msw.test.ts, apps/worker/src/engine/runner.transitions.test.ts, apps/worker/src/engine/runner.workflow-chain.test.ts
