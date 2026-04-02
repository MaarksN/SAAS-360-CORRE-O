# apps/api/src/modules/auth/auth.service.shared.ts

## Purpose
- Executable source under apps. Declares exports such as ApiKeyScope, AuthIdleConfig, AuthenticatedContext, SessionTokens, canManageRole, +8 more.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: @birthub/config, @birthub/database
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
- Size: 3491 bytes
- SHA-256: b933ab5350d840eea654a8af3775d1f6eabed55889fb30ed62b57a203f620736
- Direct imports/refs: @birthub/config, @birthub/database
- Env vars: none
- Related tests: none
