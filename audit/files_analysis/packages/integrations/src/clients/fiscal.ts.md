# packages/integrations/src/clients/fiscal.ts

## Purpose
- Executable source under packages. Declares exports such as ENotasClient, FiscalInvoice, FiscalResponse, IFiscalClient.

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
- Size: 2829 bytes
- SHA-256: ede0d03c5312bfa9625f43af5543ad7ed83f2b2735a3fa4ca475a758fff0a5f6
- Direct imports/refs: ./http
- Env vars: none
- Related tests: none
