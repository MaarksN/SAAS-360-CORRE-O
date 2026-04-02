# scripts/ci/check-branch-name.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: ./shared.mjs, node:child_process
- Env vars: GITHUB_HEAD_REF, GITHUB_REF_NAME
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 4 time(s) in runtime code.
- direct_env_access: Reads environment variables directly outside the shared config surface.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 60/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: scripts
- Size: 1207 bytes
- SHA-256: 5ebbde6f14514d45f2e5fe57135ceddcfcb3ebab8c14a24e7a28990ca309ea86
- Direct imports/refs: ./shared.mjs, node:child_process
- Env vars: GITHUB_HEAD_REF, GITHUB_REF_NAME
- Related tests: none
