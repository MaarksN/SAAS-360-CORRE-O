# packages/database/prisma/seeds/seed-agents.ts

## Purpose
- Executable source under packages. Declares exports such as seedAgents.

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
- Size: 514 bytes
- SHA-256: a3add2c0c48b8a30e431763227ea1b25c5c1a0b5c00f0b835d6a2796522fa71d
- Direct imports/refs: ./shared.js, @prisma/client
- Env vars: none
- Related tests: none
