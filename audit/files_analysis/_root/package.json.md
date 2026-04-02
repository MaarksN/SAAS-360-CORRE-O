# package.json

## Purpose
- Configuration or manifest file controlling runtime/build behavior. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: packages/agent-packs/corporate-v1/tests/catalog.smoke.test.ts, packages/agent-packs/test/github-collection-compiler.test.ts, packages/agent-packs/test/github-collection-readiness.test.ts, packages/agent-packs/test/manifest-schema.test.ts, packages/agent-packs/test/pack-regression.test.ts, packages/agent-packs/test/pack-smoke.test.ts, packages/agent-runtime/src/__tests__/runtime.test.ts, packages/agents-core/src/__tests__/agent-api-manifest-parser.test.ts

## Operational Relevance
- Included in the SaaS score because it affects deployment, security or environment control.

## Problems
- No heuristic issues were triggered by the static scan.

## Risk Score
- 10/100

## Status
- OK

## Evidence
- Kind: config
- Language: JSON
- Top level: package.json
- Size: 12639 bytes
- SHA-256: 1dedff394a7e4b0cf7f5e3a3d361671233c74acb5edf8929078c0c14123a9448
- Direct imports/refs: none
- Env vars: none
- Related tests: packages/agent-packs/corporate-v1/tests/catalog.smoke.test.ts, packages/agent-packs/test/github-collection-compiler.test.ts, packages/agent-packs/test/github-collection-readiness.test.ts, packages/agent-packs/test/manifest-schema.test.ts, packages/agent-packs/test/pack-regression.test.ts, packages/agent-packs/test/pack-smoke.test.ts, packages/agent-runtime/src/__tests__/runtime.test.ts, packages/agents-core/src/__tests__/agent-api-manifest-parser.test.ts
