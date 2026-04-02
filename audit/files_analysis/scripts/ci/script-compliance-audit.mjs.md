# scripts/ci/script-compliance-audit.mjs

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
- console_logging: Uses console-based logging 5 time(s) in runtime code.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 55/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: scripts
- Size: 9114 bytes
- SHA-256: 4f5cee40c34fae16500bbcfd1275a60b43a4f3b1daf468cf369649093cea1f25
- Direct imports/refs: ./shared.mjs, node:fs, node:path
- Env vars: none
- Related tests: none
