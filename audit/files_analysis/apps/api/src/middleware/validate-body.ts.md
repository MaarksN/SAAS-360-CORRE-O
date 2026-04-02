# apps/api/src/middleware/validate-body.ts

## Purpose
- Executable source under apps. Declares exports such as validateBody.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../lib/problem-details.js, express, zod
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
- Size: 510 bytes
- SHA-256: 5bdf38ec1336f6784037cd4a1e9067f0034363c8b471e05d6be6cc0e4bb70b3f
- Direct imports/refs: ../lib/problem-details.js, express, zod
- Env vars: none
- Related tests: none
