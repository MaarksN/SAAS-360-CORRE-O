# packages/queue/src/index.ts

## Purpose
- Executable source under packages. Declares exports such as QUEUES, QueueManager, QueueManagerOptions, closeRedis, createQueue, +3 more.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./definitions, ./definitions.js, ./job-context, ./workers, @birthub/logger, @birthub/shared-types, bullmq, ioredis, +1 more
- Env vars: REDIS_URL
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- any_usage: Contains 4 occurrence(s) of 'any'.
- direct_env_access: Reads environment variables directly outside the shared config surface.

## Risk Score
- 37/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 11263 bytes
- SHA-256: a240e057477e0339475edcf2afde3a3ebb80e16308ee49cc10f6da6fef700b4e
- Direct imports/refs: ./definitions, ./definitions.js, ./job-context, ./workers, @birthub/logger, @birthub/shared-types, bullmq, ioredis, +1 more
- Env vars: REDIS_URL
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
