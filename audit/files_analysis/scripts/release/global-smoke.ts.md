# scripts/release/global-smoke.ts

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: ../ci/shared.mjs, node:child_process, node:fs/promises, node:path
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
- Language: TypeScript
- Top level: scripts
- Size: 2973 bytes
- SHA-256: 567012ea7ad402324ce4b7ab6bacca7b4dc6c6d234c62bc08e7a9c7ea6941953
- Direct imports/refs: ../ci/shared.mjs, node:child_process, node:fs/promises, node:path
- Env vars: none
- Related tests: none
