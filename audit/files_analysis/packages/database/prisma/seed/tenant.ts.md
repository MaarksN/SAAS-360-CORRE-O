# packages/database/prisma/seed/tenant.ts

## Purpose
- Executable source under packages. Declares exports such as createTenant, disconnectTenantClient.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./data.js, ./types.js, ./workflows.js, @prisma/client, node:crypto
- Env vars: none
- Related tests: apps/api/test/tenant-cache.hit-miss.test.ts, apps/api/tests/tenant-auth-hardening.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 47/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 11381 bytes
- SHA-256: 7f8eb698a4abc21100943cd380810c714fad6880fe26057117eb5e0ce066bd9b
- Direct imports/refs: ./data.js, ./types.js, ./workflows.js, @prisma/client, node:crypto
- Env vars: none
- Related tests: apps/api/test/tenant-cache.hit-miss.test.ts, apps/api/tests/tenant-auth-hardening.test.ts
