# apps/api/src/modules/agents/service.config.ts

## Purpose
- Configuration or manifest file controlling runtime/build behavior. Declares exports such as mergeManagedPolicies, normalizeConfigObject, parseAgentConfig.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/encryption.js, ./service.types.js, @birthub/agents-core
- Env vars: none
- Related tests: none

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
- Top level: apps
- Size: 3704 bytes
- SHA-256: 2120af72d072eb51ad9da016c4d509d5572d6c4b6acb8420a69097bc9cba21fa
- Direct imports/refs: ../../lib/encryption.js, ./service.types.js, @birthub/agents-core
- Env vars: none
- Related tests: none
