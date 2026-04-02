# packages/database/prisma/seed/helpers.ts

## Purpose
- Executable source under packages. Declares exports such as disconnectSeedClient, seedPlans, wipeDatabase.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./data.js, ./types.js, @prisma/client
- Env vars: none
- Related tests: apps/api/tests/installed-agents-helpers.test.ts

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
- Size: 2208 bytes
- SHA-256: 005b959ab19719fda658d7227be0a0f136a2996eb2557e94c20adffdeeacf8bc
- Direct imports/refs: ./data.js, ./types.js, @prisma/client
- Env vars: none
- Related tests: apps/api/tests/installed-agents-helpers.test.ts
