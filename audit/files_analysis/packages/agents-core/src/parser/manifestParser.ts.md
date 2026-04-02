# packages/agents-core/src/parser/manifestParser.ts

## Purpose
- Executable source under packages. Declares exports such as AgentManifestParseError, parseAgentManifest.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../schemas/manifest.schema.js, zod
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
- Size: 2246 bytes
- SHA-256: 6ad39189838fdd7b63dfa785b0e2c6fa3ffe95b42ad3737a7ca2a59dadcf29f4
- Direct imports/refs: ../schemas/manifest.schema.js, zod
- Env vars: none
- Related tests: none
