# packages/database/src/repositories/access-control.ts

## Purpose
- Executable source under packages. Declares exports such as buildTenantMembershipFilter, findMembershipForTenant, hasRequiredRole, requireMembershipForTenant.

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
- Size: 1114 bytes
- SHA-256: 24683b85155581e6b6cede385b6bf0d501e7a692bdb79bfbc3275e97bc847e73
- Direct imports/refs: ../client.js, @prisma/client
- Env vars: none
- Related tests: none
