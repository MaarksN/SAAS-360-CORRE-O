# apps/web/components/dashboard-billing-gate.tsx

## Purpose
- Executable source under apps. Declares exports such as DashboardBillingGate.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: ../lib/auth-client, next/navigation, react
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
- Size: 2147 bytes
- SHA-256: 1e50847e57bf6a39bb22ccfda416d255869342b28f5d4fe2b9645fe5ce62dc76
- Direct imports/refs: ../lib/auth-client, next/navigation, react
- Env vars: none
- Related tests: none
