# apps/api/src/modules/agents/service.ts

## Purpose
- Executable source under apps. Declares exports such as InstalledAgentsService, installedAgentsService.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/problem-details.js, ../marketplace/marketplace-service.js, ./service.config.js, ./service.execution.js, ./service.policy.js, ./service.repository.js, ./service.snapshot.js, ./service.types.js, +3 more
- Env vars: DATABASE_URL
- Related tests: apps/api/tests/metrics.service.test.ts, packages/conversation-core/src/__tests__/service.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- direct_env_access: Reads environment variables directly outside the shared config surface.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 37/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 9098 bytes
- SHA-256: 578f256ac934f0d775d8cb0d5da6fb82b7d06bb238369f7dc0f13887fb116fb6
- Direct imports/refs: ../../lib/problem-details.js, ../marketplace/marketplace-service.js, ./service.config.js, ./service.execution.js, ./service.policy.js, ./service.repository.js, ./service.snapshot.js, ./service.types.js, +3 more
- Env vars: DATABASE_URL
- Related tests: apps/api/tests/metrics.service.test.ts, packages/conversation-core/src/__tests__/service.test.ts
