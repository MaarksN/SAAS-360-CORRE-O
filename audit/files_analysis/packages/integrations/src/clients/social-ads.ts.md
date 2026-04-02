# packages/integrations/src/clients/social-ads.ts

## Purpose
- Executable source under packages. Declares exports such as GoogleAdsApiClient, MetaAdsApiClient, MetaCloudApiClient.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./http
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
- Top level: packages
- Size: 1234 bytes
- SHA-256: 216b4e6730fd33826bc4aedd8b7119cd29edfa0ec99e2b10fc75d1bb8e760fa6
- Direct imports/refs: ./http
- Env vars: none
- Related tests: none
