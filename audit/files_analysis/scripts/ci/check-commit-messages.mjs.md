# scripts/ci/check-commit-messages.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: ./shared.mjs, node:child_process, node:fs, node:path
- Env vars: COMMIT_CHECK_BASE, GITHUB_BASE_REF
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 6 time(s) in runtime code.
- direct_env_access: Reads environment variables directly outside the shared config surface.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 65/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: scripts
- Size: 4273 bytes
- SHA-256: 67e92e5d984c3383d96cb8a36813293e589ebb854b8bcab63ec5e1e0a10f1af1
- Direct imports/refs: ./shared.mjs, node:child_process, node:fs, node:path
- Env vars: COMMIT_CHECK_BASE, GITHUB_BASE_REF
- Related tests: none
