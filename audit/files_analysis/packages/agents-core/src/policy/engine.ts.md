# packages/agents-core/src/policy/engine.ts

## Purpose
- Executable source under packages. Declares exports such as InMemoryPolicyAdminStore, ManagedPolicy, PolicyContext, PolicyDeniedError, PolicyEffect, +5 more.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: apps/voice-engine/src/server.test.ts, apps/worker/src/engine/runner.agent.smoke.test.ts, apps/worker/src/engine/runner.cancel.test.ts, apps/worker/src/engine/runner.db-integration.test.ts, apps/worker/src/engine/runner.http.msw.test.ts, apps/worker/src/engine/runner.transitions.test.ts, apps/worker/src/engine/runner.workflow-chain.test.ts

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
- Top level: packages
- Size: 4975 bytes
- SHA-256: 7082dc8fba85d08082ee0eac4280938e33119c69bfddae1960666a7b319aee32
- Direct imports/refs: none
- Env vars: none
- Related tests: apps/voice-engine/src/server.test.ts, apps/worker/src/engine/runner.agent.smoke.test.ts, apps/worker/src/engine/runner.cancel.test.ts, apps/worker/src/engine/runner.db-integration.test.ts, apps/worker/src/engine/runner.http.msw.test.ts, apps/worker/src/engine/runner.transitions.test.ts, apps/worker/src/engine/runner.workflow-chain.test.ts
