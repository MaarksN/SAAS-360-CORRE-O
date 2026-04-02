# packages/config/src/api.config.ts

## Purpose
- Configuration or manifest file controlling runtime/build behavior. Declares exports such as ApiConfig, apiEnvSchema, getApiConfig.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./shared.js, zod
- Env vars: none
- Related tests: packages/config/src/api.config.test.ts

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
- Size: 8469 bytes
- SHA-256: 999a21111aa3cd8c9d881a4720fab42595705337a5467913aea92269f90fdb82
- Direct imports/refs: ./shared.js, zod
- Env vars: none
- Related tests: packages/config/src/api.config.test.ts
