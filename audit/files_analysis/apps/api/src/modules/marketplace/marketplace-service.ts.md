# apps/api/src/modules/marketplace/marketplace-service.ts

## Purpose
- Executable source under apps. Declares exports such as MarketplaceService, marketplaceService.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: @birthub/agents-core, @birthub/database, node:fs, node:path
- Env vars: DATABASE_URL
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- direct_env_access: Reads environment variables directly outside the shared config surface.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 52/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 7118 bytes
- SHA-256: 735955f969aa21d31106726635024d938dede225e2229c1514a771b96178804e
- Direct imports/refs: @birthub/agents-core, @birthub/database, node:fs, node:path
- Env vars: DATABASE_URL
- Related tests: none
