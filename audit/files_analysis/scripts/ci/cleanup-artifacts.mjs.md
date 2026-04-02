# scripts/ci/cleanup-artifacts.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: ./shared.mjs, node:child_process, node:fs, node:path
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 3 time(s) in runtime code.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 45/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: scripts
- Size: 1664 bytes
- SHA-256: e4d5749ed99686f3333bbf2d6578197cf64cde3e18256d05a17a422a54e6e85f
- Direct imports/refs: ./shared.mjs, node:child_process, node:fs, node:path
- Env vars: none
- Related tests: none
