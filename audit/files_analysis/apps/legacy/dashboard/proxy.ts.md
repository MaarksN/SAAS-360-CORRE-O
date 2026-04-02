# apps/legacy/dashboard/proxy.ts

## Purpose
- Executable source under apps. Declares exports such as config, proxy.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: next/server
- Env vars: API_URL
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
- Size: 1376 bytes
- SHA-256: e928f94b5dd499e6bcf46fdb176a213c892a2153195d204e754ad1ba8d84819a
- Direct imports/refs: next/server
- Env vars: API_URL
- Related tests: none
