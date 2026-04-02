# packages/agent-packs/github-agents-v1/lead-scoring-modeler-github-pack/manifest.json

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
- Size: 10489 bytes
- SHA-256: 021ebc1efd074f57d915aee87bd5f1d1aa854291827e19e1c5e29ed8acac2708
- Direct imports/refs: none
- Env vars: none
- Related tests: packages/agent-packs/test/manifest-schema.test.ts, packages/agents-core/src/__tests__/agent-api-manifest-parser.test.ts, packages/agents-core/src/__tests__/manifest-parser.test.ts
