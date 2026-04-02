# scripts/performance/database-baseline.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: @birthub/database, node:fs, node:path, node:perf_hooks
- Env vars: DATABASE_URL
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- direct_env_access: Reads environment variables directly outside the shared config surface.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 52/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: scripts
- Size: 1677 bytes
- SHA-256: e7e2bd596e38d6d15e4d4a4b754c392d248b20e699c576df4afa01d793561316
- Direct imports/refs: @birthub/database, node:fs, node:path, node:perf_hooks
- Env vars: DATABASE_URL
- Related tests: none
