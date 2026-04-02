# apps/web/providers/AnalyticsProvider.tsx

## Purpose
- Executable source under apps. Declares exports such as AnalyticsProvider, useAnalytics.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: ../lib/auth-client, ../stores/user-preferences-store, next/navigation, react
- Env vars: NEXT_PUBLIC_POSTHOG_HOST, NEXT_PUBLIC_POSTHOG_KEY
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- direct_env_access: Reads environment variables directly outside the shared config surface.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 72/100

## Status
- CRITICO

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 6300 bytes
- SHA-256: 71aa28c01853d7e86db1d9a74332f4508b1cd369cd8ff4d83767e1c397564b88
- Direct imports/refs: ../lib/auth-client, ../stores/user-preferences-store, next/navigation, react
- Env vars: NEXT_PUBLIC_POSTHOG_HOST, NEXT_PUBLIC_POSTHOG_KEY
- Related tests: none
