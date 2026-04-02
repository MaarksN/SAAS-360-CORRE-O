# packages/testing/package.json

## Purpose
- Configuration or manifest file controlling runtime/build behavior. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: packages/agent-packs/corporate-v1/tests/catalog.smoke.test.ts, packages/agent-packs/test/github-collection-compiler.test.ts, packages/agent-packs/test/github-collection-readiness.test.ts, packages/agent-packs/test/manifest-schema.test.ts, packages/agent-packs/test/pack-regression.test.ts, packages/agent-packs/test/pack-smoke.test.ts, packages/agent-runtime/src/__tests__/runtime.test.ts, packages/agents-core/src/__tests__/agent-api-manifest-parser.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- No heuristic issues were triggered by the static scan.

## Risk Score
- 10/100

## Status
- OK

## Evidence
- Kind: config
- Language: JSON
- Top level: packages
- Size: 620 bytes
- SHA-256: 0a534af1ecea6a40d29fdc963bb4a3ae9e45480719da6a5836c474cbedfc4e9a
- Direct imports/refs: none
- Env vars: none
- Related tests: packages/agent-packs/corporate-v1/tests/catalog.smoke.test.ts, packages/agent-packs/test/github-collection-compiler.test.ts, packages/agent-packs/test/github-collection-readiness.test.ts, packages/agent-packs/test/manifest-schema.test.ts, packages/agent-packs/test/pack-regression.test.ts, packages/agent-packs/test/pack-smoke.test.ts, packages/agent-runtime/src/__tests__/runtime.test.ts, packages/agents-core/src/__tests__/agent-api-manifest-parser.test.ts
