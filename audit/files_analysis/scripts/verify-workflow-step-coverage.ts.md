# scripts/verify-workflow-step-coverage.ts

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: node:fs/promises, node:path, node:url
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
- Size: 4810 bytes
- SHA-256: 63274faae8938a1d2ff8f03baf887d91ce9ff56b2068152034cd900dae740e96
- Direct imports/refs: node:fs/promises, node:path, node:url
- Env vars: none
- Related tests: none
