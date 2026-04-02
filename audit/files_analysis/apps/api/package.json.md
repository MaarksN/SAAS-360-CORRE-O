# apps/api/package.json

## Purpose
- Configuration or manifest file controlling runtime/build behavior. No explicit named exports detected.

## Architectural Role
- API layer component.

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
- Top level: apps
- Size: 1837 bytes
- SHA-256: e07a166c30880b477c1ed18155720ad29058523095107d0055ed7ec7f298ae71
- Direct imports/refs: none
- Env vars: none
- Related tests: packages/agent-packs/corporate-v1/tests/catalog.smoke.test.ts, packages/agent-packs/test/github-collection-compiler.test.ts, packages/agent-packs/test/github-collection-readiness.test.ts, packages/agent-packs/test/manifest-schema.test.ts, packages/agent-packs/test/pack-regression.test.ts, packages/agent-packs/test/pack-smoke.test.ts, packages/agent-runtime/src/__tests__/runtime.test.ts, packages/agents-core/src/__tests__/agent-api-manifest-parser.test.ts
