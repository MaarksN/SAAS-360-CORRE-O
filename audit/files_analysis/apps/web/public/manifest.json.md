# apps/web/public/manifest.json

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: packages/agent-packs/test/manifest-schema.test.ts, packages/agents-core/src/__tests__/agent-api-manifest-parser.test.ts, packages/agents-core/src/__tests__/manifest-parser.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- any_usage: Contains 2 occurrence(s) of 'any'.

## Risk Score
- 21/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: JSON
- Top level: apps
- Size: 464 bytes
- SHA-256: 3e5523e9f59d144e031ea28313259b28621c447e534695fd25b2acb452e265d1
- Direct imports/refs: none
- Env vars: none
- Related tests: packages/agent-packs/test/manifest-schema.test.ts, packages/agents-core/src/__tests__/agent-api-manifest-parser.test.ts, packages/agents-core/src/__tests__/manifest-parser.test.ts
