# packages/shared-types/src/index.ts

## Purpose
- Executable source under packages. Declares exports such as Activity, ActivityType, AgentLog, AgentRole, BaseResponse, +17 more.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./schemas/leads
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- any_usage: Contains 17 occurrence(s) of 'any'.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 57/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 8640 bytes
- SHA-256: 4b525848e292e0ca04182af0d6885a33e240662333ce374c2a173f6d9da76792
- Direct imports/refs: ./schemas/leads
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
