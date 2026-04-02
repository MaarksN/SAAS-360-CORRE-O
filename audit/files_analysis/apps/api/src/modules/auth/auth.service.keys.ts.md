# apps/api/src/modules/auth/auth.service.keys.ts

## Purpose
- Executable source under apps. Declares exports such as createTenantApiKey, introspectApiKey, listTenantApiKeys, revokeTenantApiKey, rotateTenantApiKey, +1 more.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ./auth.service.shared.js, ./crypto.js, @birthub/config, @birthub/database
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
- Size: 4801 bytes
- SHA-256: 693d482d19f59f567f2923748e882741ab9620127a92a151f333c571c78b2839
- Direct imports/refs: ./auth.service.shared.js, ./crypto.js, @birthub/config, @birthub/database
- Env vars: none
- Related tests: none
