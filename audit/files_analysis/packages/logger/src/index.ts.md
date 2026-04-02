# packages/logger/src/index.ts

## Purpose
- Executable source under packages. Declares exports such as LogContext, createLogger, getLogContext, runWithLogContext, updateLogContext.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./metrics.js, ./otel.js, node:async_hooks, pino
- Env vars: LOG_LEVEL, LOG_SAMPLE_RATE, NODE_ENV
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- direct_env_access: Reads environment variables directly outside the shared config surface.

## Risk Score
- 25/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 4584 bytes
- SHA-256: ab29a1b684303534804ad24bc62a0117d25cdda79621dd3de7229595db6ab6bd
- Direct imports/refs: ./metrics.js, ./otel.js, node:async_hooks, pino
- Env vars: LOG_LEVEL, LOG_SAMPLE_RATE, NODE_ENV
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
