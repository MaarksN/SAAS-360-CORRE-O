# packages/database/src/repositories/base.repo.ts

## Purpose
- Executable source under packages. Declares exports such as BaseRepository.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../errors/tenant-required.error.js, ../tenant-context.js
- Env vars: none
- Related tests: packages/database/test/base.repo.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- No heuristic issues were triggered by the static scan.

## Risk Score
- 15/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 3872 bytes
- SHA-256: a410e6a2ab3d9fe95cf2f9171d849733bf8425d38201236327fd9ba652f5acf8
- Direct imports/refs: ../errors/tenant-required.error.js, ../tenant-context.js
- Env vars: none
- Related tests: packages/database/test/base.repo.test.ts
