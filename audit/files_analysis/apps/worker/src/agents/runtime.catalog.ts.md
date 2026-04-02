# apps/worker/src/agents/runtime.catalog.ts

## Purpose
- Executable source under apps. Declares exports such as AgentConfigSnapshot, RuntimeAgentResolution, getManifestCatalog, parseAgentConfig, resolveManagedPolicies, +1 more.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: @birthub/agents-core, @birthub/database, node:fs, node:path
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
- Size: 4833 bytes
- SHA-256: 92b20f7d06c4e277073d91ea31cc6ffdb2f830c5901ab6577a1c2aa218f58eeb
- Direct imports/refs: @birthub/agents-core, @birthub/database, node:fs, node:path
- Env vars: none
- Related tests: none
