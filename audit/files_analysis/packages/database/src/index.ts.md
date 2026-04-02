# packages/database/src/index.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./client.js, ./errors/exceeded-quota.error.js, ./errors/prisma-query-timeout.error.js, ./errors/tenant-required.error.js, ./repositories/base.repo.js, ./repositories/engagement.js, ./repositories/index.js, ./tenant-context.js, +1 more
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
- Top level: packages
- Size: 396 bytes
- SHA-256: fe326eee4518820dfc2cbacdeb71961be6a0a7a6bca0a860bce32ce17378648c
- Direct imports/refs: ./client.js, ./errors/exceeded-quota.error.js, ./errors/prisma-query-timeout.error.js, ./errors/tenant-required.error.js, ./repositories/base.repo.js, ./repositories/engagement.js, ./repositories/index.js, ./tenant-context.js, +1 more
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
