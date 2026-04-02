# apps/api/src/modules/agents/service.types.ts

## Purpose
- Executable source under apps. Declares exports such as AgentConfigSnapshot, AgentExecutionRecord, AgentRecord, InstalledAgentExecutionRow, InstalledAgentRunResult, +3 more.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: @birthub/agents-core, @birthub/database
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 42/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 1717 bytes
- SHA-256: 2566737e2f36001ae8e76cc80949ff59026efb4aeead82477d5b913c802d2346
- Direct imports/refs: @birthub/agents-core, @birthub/database
- Env vars: none
- Related tests: none
