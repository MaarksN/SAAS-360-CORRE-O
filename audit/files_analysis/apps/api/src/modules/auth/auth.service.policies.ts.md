# apps/api/src/modules/auth/auth.service.policies.ts

## Purpose
- Executable source under apps. Declares exports such as assertRole, getRoleForUser, suspendUser, updateUserRoleWithAudit.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ./auth.service.shared.js, @birthub/database
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
- Size: 3084 bytes
- SHA-256: f5170998abe9f57bc316aea89ac3ff2c5da7c6ea4662b530df8e0795fb230a2f
- Direct imports/refs: ./auth.service.shared.js, @birthub/database
- Env vars: none
- Related tests: none
