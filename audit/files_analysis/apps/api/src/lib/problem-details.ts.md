# apps/api/src/lib/problem-details.ts

## Purpose
- Executable source under apps. Declares exports such as ProblemDetails, ProblemDetailsError, asyncHandler, fromZodError, toProblemDetails.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: express, zod
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 62/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 1752 bytes
- SHA-256: 86bdfd1e8b260818be271852e4621db0f8d2a616202360eafa288ff1a9abe948
- Direct imports/refs: express, zod
- Env vars: none
- Related tests: none
