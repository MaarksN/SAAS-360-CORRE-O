# packages/database/src/repositories/user-repository.ts

## Purpose
- Executable source under packages. Declares exports such as TenantUserFilters, listUsersByTenant, updateMembershipRole.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../client.js, @prisma/client
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 42/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 1287 bytes
- SHA-256: eca7a9aaed9e2aad135802b971153566ccb12cb7c6b0a077d2c042bf6db800d5
- Direct imports/refs: ../client.js, @prisma/client
- Env vars: none
- Related tests: none
