# apps/api/src/modules/billing/index.ts

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ./limit-exceeded.error.js, ./plan.utils.js, ./router.js, ./service.js, ./stripe.client.js
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
- Size: 171 bytes
- SHA-256: d8e8575b3a3f2f9c52529e7bd557da98032ffa5194b35b62d16cdffe0cc2179d
- Direct imports/refs: ./limit-exceeded.error.js, ./plan.utils.js, ./router.js, ./service.js, ./stripe.client.js
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
