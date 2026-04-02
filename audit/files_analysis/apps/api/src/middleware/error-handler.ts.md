# apps/api/src/middleware/error-handler.ts

## Purpose
- Executable source under apps. Declares exports such as errorHandler, globalErrorHandler, notFoundMiddleware.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../lib/problem-details.js, ../observability/sentry.js, @birthub/logger, express
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 30/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 2328 bytes
- SHA-256: 85062376abd6d0d4907ae7a1eda38edbf12aa38adda7e7fa0d1d4827955ad815
- Direct imports/refs: ../lib/problem-details.js, ../observability/sentry.js, @birthub/logger, express
- Env vars: none
- Related tests: none
