# apps/web/app/admin/analytics/page.tsx

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: ../../../lib/auth-client, ./analytics.css, react
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
- Size: 4655 bytes
- SHA-256: 47ab15200d81c56205cd11d9b504d6feb4567a30fd7367978356b82a57744eea
- Direct imports/refs: ../../../lib/auth-client, ./analytics.css, react
- Env vars: none
- Related tests: none
