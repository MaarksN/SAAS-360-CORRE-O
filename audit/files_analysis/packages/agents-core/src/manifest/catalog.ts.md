# packages/agents-core/src/manifest/catalog.ts

## Purpose
- Executable source under packages. Declares exports such as ManifestCatalogEntry, ManifestSearchFilters, ManifestSearchResult, agentIdsMatch, canonicalizeAgentId, +5 more.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./parser.js, ./schema.js, node:fs/promises, node:path
- Env vars: none
- Related tests: packages/agent-packs/corporate-v1/tests/catalog.smoke.test.ts, packages/agents-core/src/__tests__/catalog.test.ts

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
- Size: 8403 bytes
- SHA-256: 610eb691a2aff5e8752087c93d54e82c22a171680a3a80c9765ca184ae44bca5
- Direct imports/refs: ./parser.js, ./schema.js, node:fs/promises, node:path
- Env vars: none
- Related tests: packages/agent-packs/corporate-v1/tests/catalog.smoke.test.ts, packages/agents-core/src/__tests__/catalog.test.ts
