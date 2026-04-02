# scripts/ci/check-legacy-runtime-surface-freeze.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: node:child_process
- Env vars: GITHUB_BASE_REF
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 5 time(s) in runtime code.
- direct_env_access: Reads environment variables directly outside the shared config surface.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 77/100

## Status
- CRITICO

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: scripts
- Size: 2152 bytes
- SHA-256: f8ce2adbc7010f60de18b4ffd3736624fc98b73da2a1d64a0d737f63e0b9fc6c
- Direct imports/refs: node:child_process
- Env vars: GITHUB_BASE_REF
- Related tests: none
