# packages/workflows-core/src/index.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./errors.js, ./interpolation/interpolate.js, ./nodes/agentExecute.js, ./nodes/agentHandoff.js, ./nodes/aiTextExtract.js, ./nodes/code.js, ./nodes/condition.js, ./nodes/connectorAction.js, +8 more
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
- Size: 624 bytes
- SHA-256: 77a7025761fb6ad700301b231202f966ece63771d13d4d6a64f4a05506d9177e
- Direct imports/refs: ./errors.js, ./interpolation/interpolate.js, ./nodes/agentExecute.js, ./nodes/agentHandoff.js, ./nodes/aiTextExtract.js, ./nodes/code.js, ./nodes/condition.js, ./nodes/connectorAction.js, +8 more
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
