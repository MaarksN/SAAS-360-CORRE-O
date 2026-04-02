# scripts/ci/preflight.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: ./shared.mjs, node:child_process, node:fs
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 2 time(s) in runtime code.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 40/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: scripts
- Size: 4082 bytes
- SHA-256: 8bbaf1a1c783674a84b2c28d81989c1555d93daa1ddde125dcba463f01a18c0b
- Direct imports/refs: ./shared.mjs, node:child_process, node:fs
- Env vars: none
- Related tests: none
