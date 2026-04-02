# packages/integrations/index.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./src/clients/crm, ./src/clients/payments-br, ./src/clients/social-ads, ./src/clients/svix, ./src/index
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
- Size: 190 bytes
- SHA-256: a2b9d3fb0ae766433ec6dd0083e80d6e909cb245b5d682314d3497b89bd4d39e
- Direct imports/refs: ./src/clients/crm, ./src/clients/payments-br, ./src/clients/social-ads, ./src/clients/svix, ./src/index
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
