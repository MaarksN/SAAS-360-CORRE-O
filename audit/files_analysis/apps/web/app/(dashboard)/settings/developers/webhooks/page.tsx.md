# apps/web/app/(dashboard)/settings/developers/webhooks/page.tsx

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: ../../../../../lib/auth-client, react
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 62/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 13755 bytes
- SHA-256: 6e8894e9645b9b0e64ef3f62a5817751751b2882725c8738b627cf1bd10eacf1
- Direct imports/refs: ../../../../../lib/auth-client, react
- Env vars: none
- Related tests: none
