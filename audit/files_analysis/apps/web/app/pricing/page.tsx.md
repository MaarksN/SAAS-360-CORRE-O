# apps/web/app/pricing/page.tsx

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: ../../lib/auth-client, ./pricing.css, react
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
- Size: 5550 bytes
- SHA-256: 397e39a42592e9ab5458cb097511fd23ac2073c0d3b4c96b2f75a8d37b83879d
- Direct imports/refs: ../../lib/auth-client, ./pricing.css, react
- Env vars: none
- Related tests: none
