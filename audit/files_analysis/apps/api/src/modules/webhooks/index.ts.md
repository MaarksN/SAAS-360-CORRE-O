# apps/api/src/modules/webhooks/index.ts

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ./eventBus.js, ./router.js
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
- Size: 61 bytes
- SHA-256: a02faa947e11ffea665531f18ac0365ab6f087fbc0aec2dbded68032e40d64ea
- Direct imports/refs: ./eventBus.js, ./router.js
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
