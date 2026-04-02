# packages/agent-packs/github-agents-v1/pep-screener-github-pack/manifest.json

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: packages/agent-packs/test/manifest-schema.test.ts, packages/agents-core/src/__tests__/agent-api-manifest-parser.test.ts, packages/agents-core/src/__tests__/manifest-parser.test.ts

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
- Language: JSON
- Top level: packages
- Size: 10258 bytes
- SHA-256: 7f467782d3906967946c357dd027cfff04793349a8c988d224b375e21c590e18
- Direct imports/refs: none
- Env vars: none
- Related tests: packages/agent-packs/test/manifest-schema.test.ts, packages/agents-core/src/__tests__/agent-api-manifest-parser.test.ts, packages/agents-core/src/__tests__/manifest-parser.test.ts
