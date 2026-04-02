# packages/agents-core/src/schemas/manifest.schema.ts

## Purpose
- Executable source under packages. Declares exports such as AgentManifest, SUPPORTED_AGENT_API_VERSION, agentManifestSchema, semanticVersionSchema.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: zod
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
- Size: 1927 bytes
- SHA-256: 22ff9ae2cb47e1e34f8ab52bdcd269d749df2ecaaa05bd4a8a372b3bc43ca97f
- Direct imports/refs: zod
- Env vars: none
- Related tests: none
