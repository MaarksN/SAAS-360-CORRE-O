# packages/integrations/src/adapters/crm-adapter-factory.ts

## Purpose
- Executable source under packages. Declares exports such as CRMAdapter, CRMAdapterFactory, CRMProvider.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../clients/crm, ./cache
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
- Top level: packages
- Size: 2317 bytes
- SHA-256: 99495430897a5ed2cebd81070bca5c364bab6f732dd616211deb9950253dc045
- Direct imports/refs: ../clients/crm, ./cache
- Env vars: none
- Related tests: none
