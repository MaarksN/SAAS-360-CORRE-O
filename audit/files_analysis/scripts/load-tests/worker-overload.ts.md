# scripts/load-tests/worker-overload.ts

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: @birthub/logger, bullmq, ioredis, node:fs, node:path
- Env vars: API_HEALTH_URL, OVERLOAD_CHUNK_SIZE, OVERLOAD_JOBS, OVERLOAD_MAX_WAIT_MS, OVERLOAD_POLL_INTERVAL_MS, QUEUE_NAME, REDIS_URL
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- direct_env_access: Reads environment variables directly outside the shared config surface.
- queue_guardrails_missing: Queue usage appears without obvious retry/retention/backpressure controls in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 75/100

## Status
- CRITICO

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: scripts
- Size: 4707 bytes
- SHA-256: 12b31933be0929692c9aa04d2fa7035149adb6466e74a84484a0be6d420b8f18
- Direct imports/refs: @birthub/logger, bullmq, ioredis, node:fs, node:path
- Env vars: API_HEALTH_URL, OVERLOAD_CHUNK_SIZE, OVERLOAD_JOBS, OVERLOAD_MAX_WAIT_MS, OVERLOAD_POLL_INTERVAL_MS, QUEUE_NAME, REDIS_URL
- Related tests: none
