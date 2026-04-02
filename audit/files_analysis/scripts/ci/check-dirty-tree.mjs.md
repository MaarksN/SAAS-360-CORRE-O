# scripts/ci/check-dirty-tree.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: ./shared.mjs, node:fs, node:path
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 4 time(s) in runtime code.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 50/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: scripts
- Size: 2092 bytes
- SHA-256: 0c052209fbab8012fbf449c826044226497930e01a308558c851e574d13c4cf0
- Direct imports/refs: ./shared.mjs, node:fs, node:path
- Env vars: none
- Related tests: none
