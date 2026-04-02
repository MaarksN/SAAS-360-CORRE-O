# apps/api/src/modules/workflows/index.ts

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ./router.js, ./runnerQueue.js, ./schemas.js, ./service.js
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 27/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 124 bytes
- SHA-256: 179f217c50766e5848290c8a41d926022ae59d6e67e8102cf882c94894ca80fc
- Direct imports/refs: ./router.js, ./runnerQueue.js, ./schemas.js, ./service.js
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
