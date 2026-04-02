# packages/auth/index.ts

## Purpose
- Executable source under packages. Declares exports such as AuthConfig, AuthService, AuthUser, JWTPayload, TokenPair, +1 more.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: jose
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
- Size: 3062 bytes
- SHA-256: 9fdb360023c99a758924ab26086f18dc736639d21ec80523d91b7bdca18aad99
- Direct imports/refs: jose
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
