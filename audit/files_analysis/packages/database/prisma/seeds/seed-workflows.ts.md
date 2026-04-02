# packages/database/prisma/seeds/seed-workflows.ts

## Purpose
- Executable source under packages. Declares exports such as seedWorkflows.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./shared.js, @prisma/client
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
- Size: 515 bytes
- SHA-256: 069951d8aa795095ec2f9b72453c1513cf94109f3bdb54adcbc12bb65a2d9e1e
- Direct imports/refs: ./shared.js, @prisma/client
- Env vars: none
- Related tests: none
