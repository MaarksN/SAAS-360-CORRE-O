# packages/agent-packs/github-agents-v1/event-qualifier-github-pack/manifest.json

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
- Size: 10127 bytes
- SHA-256: 64d51e24fb0326ce0ef75530ba9d5d478c63d7d1fc9667decf54a778f41b2723
- Direct imports/refs: none
- Env vars: none
- Related tests: packages/agent-packs/test/manifest-schema.test.ts, packages/agents-core/src/__tests__/agent-api-manifest-parser.test.ts, packages/agents-core/src/__tests__/manifest-parser.test.ts
