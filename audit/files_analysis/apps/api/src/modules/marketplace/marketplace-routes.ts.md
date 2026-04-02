# apps/api/src/modules/marketplace/marketplace-routes.ts

## Purpose
- Executable source under apps. Declares exports such as createMarketplaceRouter.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../common/cache/index.js, ../../lib/problem-details.js, ../../lib/request-values.js, ./marketplace-service.js, @birthub/agents-core, express
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
- Top level: apps
- Size: 5799 bytes
- SHA-256: e30b6d054db6235a71cd7937fb4e89badc3ac43a8eaa5ef228b853a3bd66070d
- Direct imports/refs: ../../common/cache/index.js, ../../lib/problem-details.js, ../../lib/request-values.js, ./marketplace-service.js, @birthub/agents-core, express
- Env vars: none
- Related tests: none
