# apps/web/components/wizards/PackInstaller.tsx

## Purpose
- Executable source under apps. Declares exports such as PackInstaller.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: react
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
- Size: 5586 bytes
- SHA-256: 8f31f97a6952d58fcc241f90dfe45477226fda393e333f771cec5063697d284b
- Direct imports/refs: react
- Env vars: none
- Related tests: none
