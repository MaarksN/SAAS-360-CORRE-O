# apps/api/src/modules/auth/auth.service.credentials.ts

## Purpose
- Executable source under apps. Declares exports such as enableMfaForUser, loginWithPassword, setupMfaForUser, verifyMfaChallenge.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ./auth.service.sessions.js, ./auth.service.shared.js, ./crypto.js, ./mfa.service.js, @birthub/config, @birthub/database
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
- Size: 8134 bytes
- SHA-256: 1904940ffc415905b0b21366439f1a308d079f280071963131fa3aaa607152d6
- Direct imports/refs: ./auth.service.sessions.js, ./auth.service.shared.js, ./crypto.js, ./mfa.service.js, @birthub/config, @birthub/database
- Env vars: none
- Related tests: none
