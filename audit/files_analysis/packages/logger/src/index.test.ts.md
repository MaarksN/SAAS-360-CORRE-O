# packages/logger/src/index.test.ts

## Purpose
- Automated verification asset for runtime or package behavior.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./index.js, node:assert/strict, node:test
- Env vars: LOG_LEVEL, LOG_SAMPLE_RATE, NODE_ENV
- Related tests: packages/logger/src/index.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- No heuristic issues were triggered by the static scan.

## Risk Score
- 5/100

## Status
- OK

## Evidence
- Kind: test
- Language: TypeScript
- Top level: packages
- Size: 4929 bytes
- SHA-256: 3b7d14372decc2f91238d42947b132b43ccfcae0b65e9030a67c5cb7bb7e03b1
- Direct imports/refs: ./index.js, node:assert/strict, node:test
- Env vars: LOG_LEVEL, LOG_SAMPLE_RATE, NODE_ENV
- Related tests: packages/logger/src/index.test.ts
