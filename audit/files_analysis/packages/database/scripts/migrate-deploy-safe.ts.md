# packages/database/scripts/migrate-deploy-safe.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../f8.config.js, ./lib/paths.js, ./lib/process.js, @birthub/logger, @prisma/client
- Env vars: DATABASE_URL
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- direct_env_access: Reads environment variables directly outside the shared config surface.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 40/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 2150 bytes
- SHA-256: 8d3bcaad49ab63e3ec2f5be92ef29a5357cc9039d815557c3d6eb042b138df44
- Direct imports/refs: ../f8.config.js, ./lib/paths.js, ./lib/process.js, @birthub/logger, @prisma/client
- Env vars: DATABASE_URL
- Related tests: none
