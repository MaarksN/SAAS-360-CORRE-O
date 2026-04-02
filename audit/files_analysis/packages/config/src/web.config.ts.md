# packages/config/src/web.config.ts

## Purpose
- Configuration or manifest file controlling runtime/build behavior. Declares exports such as WebConfig, getWebConfig, webEnvSchema.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./shared.js, zod
- Env vars: none
- Related tests: packages/config/src/web.config.test.ts

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
- Language: TypeScript
- Top level: packages
- Size: 2246 bytes
- SHA-256: 178e45e7bf4e12f3874a336613f2ac1c7d950dbe25b654a82bf34256cd1f45d5
- Direct imports/refs: ./shared.js, zod
- Env vars: none
- Related tests: packages/config/src/web.config.test.ts
