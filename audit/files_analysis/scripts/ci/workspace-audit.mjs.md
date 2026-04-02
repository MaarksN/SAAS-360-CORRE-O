# scripts/ci/workspace-audit.mjs

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
- Size: 5305 bytes
- SHA-256: 8c19099cbf005521d6c3371005ef0ab6baaceb73adbbfa67042fae93a347abd0
- Direct imports/refs: ./shared.mjs, node:fs, node:path
- Env vars: none
- Related tests: none
