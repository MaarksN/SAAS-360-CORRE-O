# packages/security/index.ts

## Purpose
- Executable source under packages. Declares exports such as buildCspHeader, createRateLimiter, sanitizeHtml, scanSecrets.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: isomorphic-dompurify
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
- Size: 1132 bytes
- SHA-256: 11384ca240dbb4ebb6c7cd5c27a80175e82f1560805fe2ed084c91fdba74e359
- Direct imports/refs: isomorphic-dompurify
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
