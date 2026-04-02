# packages/config/src/worker.config.ts

## Purpose
- Configuration or manifest file controlling runtime/build behavior. Declares exports such as WorkerConfig, getWorkerConfig, workerEnvSchema.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./shared.js, node:os, zod
- Env vars: none
- Related tests: packages/config/src/worker.config.test.ts

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
- Size: 3955 bytes
- SHA-256: 6f8e9db053fcadb2f694373057d0c17e78486edac76d0d7d88648db07c90595e
- Direct imports/refs: ./shared.js, node:os, zod
- Env vars: none
- Related tests: packages/config/src/worker.config.test.ts
