# apps/api/src/modules/auth/index.ts

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ./auth.service.js, ./cookies.js, ./crypto.js, ./mfa.service.js
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
- Top level: apps
- Size: 128 bytes
- SHA-256: 02c32356f4d039aa58cc53468a8d8c1e5122af996eecfcdd56bad1fad1462589
- Direct imports/refs: ./auth.service.js, ./cookies.js, ./crypto.js, ./mfa.service.js
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
