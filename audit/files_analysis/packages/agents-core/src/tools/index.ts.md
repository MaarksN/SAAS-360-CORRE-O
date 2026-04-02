# packages/agents-core/src/tools/index.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./baseTool.js, ./calendar.tool.js, ./crm.tool.js, ./dbReadTool.js, ./dbWriteTool.js, ./email.tool.js, ./httpTool.js, ./sendEmailTool.js, +2 more
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
- Size: 333 bytes
- SHA-256: 85c794f35ed671abd17e13417b03bbf08ecbcdb7b9e8bab4b6212d86c383789e
- Direct imports/refs: ./baseTool.js, ./calendar.tool.js, ./crm.tool.js, ./dbReadTool.js, ./dbWriteTool.js, ./email.tool.js, ./httpTool.js, ./sendEmailTool.js, +2 more
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
