# packages/agents-registry/src/index.ts

## Purpose
- Executable source under packages. Declares exports such as AgentIndexItem, AgentRecord, AgentRegistry, AgentRegistryStore, AgentVersionRecord, +9 more.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: node:crypto, semver
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts

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
- Language: TypeScript
- Top level: packages
- Size: 14616 bytes
- SHA-256: cb71c0ef6dc64ac08a7b81cbeaa50bce686c9ac05fd7470f2a446d06d961f633
- Direct imports/refs: node:crypto, semver
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
