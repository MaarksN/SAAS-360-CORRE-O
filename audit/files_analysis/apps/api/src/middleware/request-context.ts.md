# apps/api/src/middleware/request-context.ts

## Purpose
- Executable source under apps. Declares exports such as RequestContext, requestContextMiddleware.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: @birthub/database, @birthub/logger, express, node:crypto
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
- Size: 1997 bytes
- SHA-256: 3f5fa433cc41e30e43d1b9a1f9e223ecfc53d69d5122a9ce5e945905db9f5a42
- Direct imports/refs: @birthub/database, @birthub/logger, express, node:crypto
- Env vars: none
- Related tests: none
