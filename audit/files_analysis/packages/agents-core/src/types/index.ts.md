# packages/agents-core/src/types/index.ts

## Purpose
- Executable source under packages. Declares exports such as AgentDefinition, AgentLearningLessonType, AgentLearningRecord, AgentRestrictionPolicy, AgentSkillReference, +9 more.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: none
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
- Size: 2076 bytes
- SHA-256: 7a052e01133bdacb6215384418aff0648169b1ef8d5f0420fff902198b32ec46
- Direct imports/refs: none
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
