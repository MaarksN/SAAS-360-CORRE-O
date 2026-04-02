# packages/integrations/src/index.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./adapters/crm-adapter-factory, ./adapters/email-adapter-factory, ./adapters/webhook-registry, ./clients/calendar, ./clients/crm, ./clients/fiscal, ./clients/llm, ./clients/payments-br, +3 more
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
- Size: 435 bytes
- SHA-256: bfa09049a8c55aa73501b980bdd3a2a8219c24477126488917aef652e726975c
- Direct imports/refs: ./adapters/crm-adapter-factory, ./adapters/email-adapter-factory, ./adapters/webhook-registry, ./clients/calendar, ./clients/crm, ./clients/fiscal, ./clients/llm, ./clients/payments-br, +3 more
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
