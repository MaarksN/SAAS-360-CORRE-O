# scripts/ci/full.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: ./shared.mjs, node:net, node:path
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
- Size: 7272 bytes
- SHA-256: ed28d1231ab058c6fa9155709d2c9c22bd87281aa88fa0c978634f4439372315
- Direct imports/refs: ./shared.mjs, node:net, node:path
- Env vars: none
- Related tests: none
