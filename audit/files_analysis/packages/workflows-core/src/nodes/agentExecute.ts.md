# packages/workflows-core/src/nodes/agentExecute.ts

## Purpose
- Executable source under packages. Declares exports such as AgentExecuteConfig, AgentExecutor, executeAgentNode.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../interpolation/interpolate.js, ../types.js
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
- Top level: packages
- Size: 1041 bytes
- SHA-256: f92ff22adf0a2d6045e59fd55b0bb0b23dae4e38b8cee8906bd02bd36f757a57
- Direct imports/refs: ../interpolation/interpolate.js, ../types.js
- Env vars: none
- Related tests: none
