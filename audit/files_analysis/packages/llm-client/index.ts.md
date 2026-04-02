# packages/llm-client/index.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./src/index
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
- Size: 30 bytes
- SHA-256: 5784945ad821946f5d66dc31ad561f394c10440eb5ccbd3b80e784be5ca2970f
- Direct imports/refs: ./src/index
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
