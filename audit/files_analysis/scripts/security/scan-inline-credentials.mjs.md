# scripts/security/scan-inline-credentials.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: node:fs, node:path
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
- Size: 3730 bytes
- SHA-256: 1733f192000ff9d9c5d3e3c3ee0e2a69af4d76367eff404ea3caa950ab254306
- Direct imports/refs: node:fs, node:path
- Env vars: none
- Related tests: none
