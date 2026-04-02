# packages/utils/src/logger.ts

## Purpose
- Executable source under packages. Declares exports such as LegacyLogger, createLogger, logger.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: @birthub/logger
- Env vars: none
- Related tests: packages/logger/src/index.test.ts, packages/logger/src/metrics.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- No heuristic issues were triggered by the static scan.

## Risk Score
- 15/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 1515 bytes
- SHA-256: dba3a629cdd7a4810ee049a960da447be4c4841fe28d4e5361f8e5e252b2568b
- Direct imports/refs: @birthub/logger
- Env vars: none
- Related tests: packages/logger/src/index.test.ts, packages/logger/src/metrics.test.ts
