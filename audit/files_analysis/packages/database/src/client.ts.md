# packages/database/src/client.ts

## Purpose
- Executable source under packages. Declares exports such as pingDatabase, pingDatabaseDeep, prisma, withTenantDatabaseContext.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./errors/prisma-query-timeout.error.js, ./tenant-context.js, @prisma/client, node:crypto
- Env vars: DATABASE_CONNECTION_LIMIT, DATABASE_URL, DB_SLOW_QUERY_MS, NODE_ENV
- Related tests: packages/llm-client/src/index.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- direct_env_access: Reads environment variables directly outside the shared config surface.

## Risk Score
- 25/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 8158 bytes
- SHA-256: 12c71e2aad24549a028cbadef522b31ae660ebeb228e787b4b62f9b66e05d3bb
- Direct imports/refs: ./errors/prisma-query-timeout.error.js, ./tenant-context.js, @prisma/client, node:crypto
- Env vars: DATABASE_CONNECTION_LIMIT, DATABASE_URL, DB_SLOW_QUERY_MS, NODE_ENV
- Related tests: packages/llm-client/src/index.test.ts
