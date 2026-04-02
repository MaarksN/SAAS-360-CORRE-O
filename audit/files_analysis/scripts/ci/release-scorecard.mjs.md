# scripts/ci/release-scorecard.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: ./shared.mjs, node:child_process, node:fs
- Env vars: RELEASE_SCORECARD_MIN_SCORE
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 1 time(s) in runtime code.
- direct_env_access: Reads environment variables directly outside the shared config surface.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 57/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: scripts
- Size: 3168 bytes
- SHA-256: 0b931e527f2c2b1bfbbef78e3b72d8e7f38e3ccc408ef29ab985b174d683690d
- Direct imports/refs: ./shared.mjs, node:child_process, node:fs
- Env vars: RELEASE_SCORECARD_MIN_SCORE
- Related tests: none
