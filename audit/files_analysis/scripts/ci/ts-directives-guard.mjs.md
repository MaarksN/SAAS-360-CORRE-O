# scripts/ci/ts-directives-guard.mjs

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
- console_logging: Uses console-based logging 6 time(s) in runtime code.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 55/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: scripts
- Size: 1982 bytes
- SHA-256: 6f8efd4d681158c90c17263777952bf4c7b70a1231491c098abb0d408599afd2
- Direct imports/refs: ./shared.mjs, node:child_process, node:fs, node:path
- Env vars: none
- Related tests: none
