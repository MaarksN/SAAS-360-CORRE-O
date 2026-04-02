# packages/database/prisma/seed/data.ts

## Purpose
- Executable source under packages. Declares exports such as buildTenantWorkflows, plans, tenants.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./types.js, @prisma/client, node:crypto
- Env vars: none
- Related tests: packages/database/test/base.repo.test.ts, packages/database/test/migration.test.ts, packages/database/test/rls.test.ts

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
- Size: 8145 bytes
- SHA-256: 8764bc56741de0f5d26622d806756058c68523382a8b4807faca880743196ce5
- Direct imports/refs: ./types.js, @prisma/client, node:crypto
- Env vars: none
- Related tests: packages/database/test/base.repo.test.ts, packages/database/test/migration.test.ts, packages/database/test/rls.test.ts
