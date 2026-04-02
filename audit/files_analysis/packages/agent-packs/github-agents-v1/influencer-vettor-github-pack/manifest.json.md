# packages/agent-packs/github-agents-v1/influencer-vettor-github-pack/manifest.json

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
- Size: 10413 bytes
- SHA-256: b798d95ed9c2182b2e381b00e5a3797cf848dadad0405ed19bd9930ec4f626b8
- Direct imports/refs: none
- Env vars: none
- Related tests: packages/agent-packs/test/manifest-schema.test.ts, packages/agents-core/src/__tests__/agent-api-manifest-parser.test.ts, packages/agents-core/src/__tests__/manifest-parser.test.ts
