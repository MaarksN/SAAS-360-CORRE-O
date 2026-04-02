# apps/api/src/modules/auth/auth.service.ts

## Purpose
- Executable source under apps. Declares exports such as authenticateRequest.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ./auth.service.credentials.js, ./auth.service.keys.js, ./auth.service.policies.js, ./auth.service.sessions.js, ./auth.service.shared.js, ./crypto.js, @birthub/config, @birthub/database
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
- Size: 5038 bytes
- SHA-256: 75b6e38cf86700e34ff8c0292f9887f4f7167f92924e06ce49b84c303927fae9
- Direct imports/refs: ./auth.service.credentials.js, ./auth.service.keys.js, ./auth.service.policies.js, ./auth.service.sessions.js, ./auth.service.shared.js, ./crypto.js, @birthub/config, @birthub/database
- Env vars: none
- Related tests: none
