# apps/api/src/middleware/authentication.ts

## Purpose
- Executable source under apps. Declares exports such as authenticationMiddleware.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../modules/auth/auth.service.js, @birthub/config, @birthub/logger, express
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
- Top level: apps
- Size: 2903 bytes
- SHA-256: 6d7e603abd523088b956434050ff4bef4b84897aa75a50de7301455f130c85a3
- Direct imports/refs: ../modules/auth/auth.service.js, @birthub/config, @birthub/logger, express
- Env vars: none
- Related tests: none
