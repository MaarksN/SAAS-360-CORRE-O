# apps/web/lib/auth-client.ts

## Purpose
- Executable source under apps. Declares exports such as StoredSession, fetchWithSession, getStoredSession, toApiUrl.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: none
- Env vars: NEXT_PUBLIC_API_URL
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
- Size: 2086 bytes
- SHA-256: 47118277832383e8e83f64ccc8508873479a3ead4b0301773384c3337e2b8f7d
- Direct imports/refs: none
- Env vars: NEXT_PUBLIC_API_URL
- Related tests: none
