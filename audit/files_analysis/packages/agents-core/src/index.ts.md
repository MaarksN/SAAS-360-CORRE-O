# packages/agents-core/src/index.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./execution/index.js, ./manifest/index.js, ./memory/memoryService.js, ./parser/manifestParser.js, ./policy/engine.js, ./runtime/index.js, ./schemas/manifest.schema.js, ./skills/index.js, +2 more
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
- Size: 746 bytes
- SHA-256: e65d4030f40f7bdf67ea0e0e0c9dd3294a9309e6bfd2325f9931543a347c1bed
- Direct imports/refs: ./execution/index.js, ./manifest/index.js, ./memory/memoryService.js, ./parser/manifestParser.js, ./policy/engine.js, ./runtime/index.js, ./schemas/manifest.schema.js, ./skills/index.js, +2 more
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
