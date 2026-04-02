# scripts/ci/repo-hygiene.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: ./shared.mjs, node:child_process, node:fs, node:module, node:path, typescript
- Env vars: GITHUB_BASE_REF, REPO_HYGIENE_BASE
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
- Size: 13728 bytes
- SHA-256: 04bfc20714e5a6f1901fef039e38d309a0e78391560246ad5a0b713752e0c205
- Direct imports/refs: ./shared.mjs, node:child_process, node:fs, node:module, node:path, typescript
- Env vars: GITHUB_BASE_REF, REPO_HYGIENE_BASE
- Related tests: none
