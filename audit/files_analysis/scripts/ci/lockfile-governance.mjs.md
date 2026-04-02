# scripts/ci/lockfile-governance.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: ./shared.mjs, node:child_process, node:crypto, node:fs, node:path, node:url
- Env vars: GITHUB_BASE_REF, GITHUB_EVENT_NAME, GITHUB_EVENT_PATH, LOCKFILE_SECURITY_LABEL
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 3 time(s) in runtime code.
- direct_env_access: Reads environment variables directly outside the shared config surface.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 67/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: scripts
- Size: 10380 bytes
- SHA-256: 317c387d6660cf1b9fff01669d5e4425d160ec22b0be50fc2d8ae6dea0256b45
- Direct imports/refs: ./shared.mjs, node:child_process, node:crypto, node:fs, node:path, node:url
- Env vars: GITHUB_BASE_REF, GITHUB_EVENT_NAME, GITHUB_EVENT_PATH, LOCKFILE_SECURITY_LABEL
- Related tests: none
