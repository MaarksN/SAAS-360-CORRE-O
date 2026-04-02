# packages/integrations/src/clients/signatures.ts

## Purpose
- Executable source under packages. Declares exports such as ClickSignClient, ISignaturesClient, SignatureDocument, Signer.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./http
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- any_usage: Contains 2 occurrence(s) of 'any'.
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 56/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 3102 bytes
- SHA-256: f13c3f025c035dbc7a460fa4d5ab3dd5e220af753f1ac15a5dd75d0462f717f3
- Direct imports/refs: ./http
- Env vars: none
- Related tests: none
