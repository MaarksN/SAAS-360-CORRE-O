# apps/api/src/modules/agents/metrics.service.ts

## Purpose
- Executable source under apps. Declares exports such as AgentMetricsService, AgentMetricsSnapshot, AgentRunLog, ExecutionStatus, FailRateAlert, +2 more.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: @birthub/database
- Env vars: DATABASE_URL
- Related tests: apps/api/tests/metrics.service.test.ts

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
- Size: 7925 bytes
- SHA-256: ee614f32b3c098768270475b68bdc1c0549d409a41f7cd59af42d873fb79d8da
- Direct imports/refs: @birthub/database
- Env vars: DATABASE_URL
- Related tests: apps/api/tests/metrics.service.test.ts
