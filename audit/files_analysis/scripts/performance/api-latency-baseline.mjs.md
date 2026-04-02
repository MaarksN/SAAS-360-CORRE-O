# scripts/performance/api-latency-baseline.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: ../../apps/api/src/app.ts, node:fs, node:path, node:perf_hooks, node:url
- Env vars: API_PORT
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 2 time(s) in runtime code.
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- direct_env_access: Reads environment variables directly outside the shared config surface.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 82/100

## Status
- CRITICO

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: scripts
- Size: 4159 bytes
- SHA-256: e8784f6b1626317d8172555003d0609de1033b0aaed049f31f0fedb088bef11b
- Direct imports/refs: ../../apps/api/src/app.ts, node:fs, node:path, node:perf_hooks, node:url
- Env vars: API_PORT
- Related tests: none
