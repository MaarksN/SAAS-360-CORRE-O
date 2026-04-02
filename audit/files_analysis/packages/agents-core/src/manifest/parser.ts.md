# packages/agents-core/src/manifest/parser.ts

## Purpose
- Executable source under packages. Declares exports such as AgentManifestParseError, parseAgentManifest.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./schema.js, zod
- Env vars: none
- Related tests: packages/agents-core/src/__tests__/agent-api-manifest-parser.test.ts, packages/agents-core/src/__tests__/manifest-parser.test.ts, packages/agents-core/test/parser.test.ts

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
- Size: 1242 bytes
- SHA-256: 16ac206809f02531619cc63186bbdd3ea707c16eb639278a32ea3f2afc5b0c24
- Direct imports/refs: ./schema.js, zod
- Env vars: none
- Related tests: packages/agents-core/src/__tests__/agent-api-manifest-parser.test.ts, packages/agents-core/src/__tests__/manifest-parser.test.ts, packages/agents-core/test/parser.test.ts
