# apps/web/lib/marketplace-api.server.ts

## Purpose
- Executable source under apps. Declares exports such as MarketplaceSearchResponse, fetchAgentChangelog, fetchAgentDocs, fetchBudgetEstimate, fetchBudgetUsage, +5 more.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: @birthub/config, next/headers
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
- Size: 5043 bytes
- SHA-256: 32b07b4d1710d8fbbee16293e25d85944f40a1ffbb5b3812b84946030cab20d7
- Direct imports/refs: @birthub/config, next/headers
- Env vars: none
- Related tests: none
