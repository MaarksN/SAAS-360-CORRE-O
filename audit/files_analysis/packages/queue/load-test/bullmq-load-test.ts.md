# packages/queue/load-test/bullmq-load-test.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../src/index, node:net
- Env vars: REDIS_URL
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- console_logging: Uses console-based logging 3 time(s) in runtime code.
- direct_env_access: Reads environment variables directly outside the shared config surface.
- queue_guardrails_missing: Queue usage appears without obvious retry/retention/backpressure controls in the same file.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 82/100

## Status
- CRITICO

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 2095 bytes
- SHA-256: 0966d779401467221bb3228c2bb43c21bcc0805df98282be2096f29c520477ed
- Direct imports/refs: ../src/index, node:net
- Env vars: REDIS_URL
- Related tests: none
