# apps/web/providers/AppProviders.tsx

## Purpose
- Executable source under apps. Declares exports such as AppProviders.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: ../components/cookie-consent-banner, ../components/paywall-provider, ./AnalyticsProvider, ./EngagementProvider, react
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
- Size: 973 bytes
- SHA-256: dcb262f61c0f343657ce9575d08b875df555f34fe07f7365f19deb7a2672df84
- Direct imports/refs: ../components/cookie-consent-banner, ../components/paywall-provider, ./AnalyticsProvider, ./EngagementProvider, react
- Env vars: none
- Related tests: none
