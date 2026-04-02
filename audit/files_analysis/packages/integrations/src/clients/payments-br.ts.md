# packages/integrations/src/clients/payments-br.ts

## Purpose
- Executable source under packages. Declares exports such as IPaymentsClient, PagarmeClient, PaymentCustomer, PaymentResponse.

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
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 68/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 4610 bytes
- SHA-256: 632733d83ed69846e0b739c8a2d7ad31ad6b5a603351bd400b4cf17ca3ced95c
- Direct imports/refs: ./http
- Env vars: none
- Related tests: none
