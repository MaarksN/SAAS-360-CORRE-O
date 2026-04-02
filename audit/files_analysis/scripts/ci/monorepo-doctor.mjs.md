# scripts/ci/monorepo-doctor.mjs

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
- console_logging: Uses console-based logging 1 time(s) in runtime code.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 35/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: scripts
- Size: 6476 bytes
- SHA-256: ec1d256ea8413c0650c8687688323ed2ae6f71827cb479d24d33ec3524a33052
- Direct imports/refs: ./shared.mjs, node:child_process, node:fs, node:path
- Env vars: none
- Related tests: none
