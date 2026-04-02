# packages/agents-core/src/skills/index.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./analyzerSkill.js, ./generatorSkill.js, ./monitorSkill.js, ./orchestratorSkill.js, ./reporterSkill.js
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts

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
- Language: TypeScript
- Top level: packages
- Size: 184 bytes
- SHA-256: 1176b419fad32fe289cff89696011e4b2ad7c151370d08ee6de16810a4b7a28a
- Direct imports/refs: ./analyzerSkill.js, ./generatorSkill.js, ./monitorSkill.js, ./orchestratorSkill.js, ./reporterSkill.js
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
