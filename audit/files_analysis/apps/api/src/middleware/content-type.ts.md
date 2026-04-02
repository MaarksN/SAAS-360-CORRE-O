# apps/api/src/middleware/content-type.ts

## Purpose
- Executable source under apps. Declares exports such as contentTypeMiddleware.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../lib/problem-details.js, express
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
- Size: 937 bytes
- SHA-256: 674af37b4d2906da6b5f79a72c8876f130d0412b2fae0f0665fd121097ba90ee
- Direct imports/refs: ../lib/problem-details.js, express
- Env vars: none
- Related tests: none
