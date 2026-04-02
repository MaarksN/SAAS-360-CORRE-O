# packages/utils/src/errors.ts

## Purpose
- Executable source under packages. Declares exports such as AppError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: packages/shared/errors/index.test.ts

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
- Size: 877 bytes
- SHA-256: 97e2113c95b75f5503216619e7a033f92a9d3026a140ac3b9aa7fa4e5e9ff91e
- Direct imports/refs: none
- Env vars: none
- Related tests: packages/shared/errors/index.test.ts
