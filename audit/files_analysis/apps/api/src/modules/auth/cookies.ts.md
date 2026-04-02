# apps/api/src/modules/auth/cookies.ts

## Purpose
- Executable source under apps. Declares exports such as clearAuthCookies, setAuthCookies.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ./auth.service.js, @birthub/config, express
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
- Size: 1493 bytes
- SHA-256: c0a59da186c4edb4a904c5a2c6cd76566f4a29d077ffe529b3c5ab8ff86ac768
- Direct imports/refs: ./auth.service.js, @birthub/config, express
- Env vars: none
- Related tests: none
