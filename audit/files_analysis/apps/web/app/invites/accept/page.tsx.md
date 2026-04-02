# apps/web/app/invites/accept/page.tsx

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: next/navigation, react
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
- Size: 2732 bytes
- SHA-256: 65b8c5a1bf9cced2d5fe6ee53defaa36ef5b24599f827efc7050177dbe063f06
- Direct imports/refs: next/navigation, react
- Env vars: NEXT_PUBLIC_API_URL
- Related tests: none
