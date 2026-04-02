# apps/api/src/audit/auditable.ts

## Purpose
- Executable source under apps. Declares exports such as Auditable.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../lib/problem-details.js, ../lib/request-values.js, ./buffer.js, express
- Env vars: none
- Related tests: apps/api/tests/auditable.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 27/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 2203 bytes
- SHA-256: bb0832a6ff85f0d028f76af9308cf3ce09cbd3ef9ee482132257d12b8b0159b2
- Direct imports/refs: ../lib/problem-details.js, ../lib/request-values.js, ./buffer.js, express
- Env vars: none
- Related tests: apps/api/tests/auditable.test.ts
