# scripts/ci/security-guardrails-local.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: ./shared.mjs, node:fs, node:net, node:path
- Env vars: CI, DATABASE_URL
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
- Size: 3627 bytes
- SHA-256: d032489e73d00858a20ca606271d596f51e5eaab898e4cddfb2c559d5ca3ddbd
- Direct imports/refs: ./shared.mjs, node:fs, node:net, node:path
- Env vars: CI, DATABASE_URL
- Related tests: none
