# scripts/ci/check-doc-links.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: ./shared.mjs, node:child_process, node:fs, node:path
- Env vars: DOC_LINKS_BASE, GITHUB_BASE_REF
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 3 time(s) in runtime code.
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- direct_env_access: Reads environment variables directly outside the shared config surface.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 75/100

## Status
- CRITICO

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: scripts
- Size: 3556 bytes
- SHA-256: 08ee6a78ae851040af240f3b20a89f51f8f1f38c5cfb2481c5545e70fa85a80e
- Direct imports/refs: ./shared.mjs, node:child_process, node:fs, node:path
- Env vars: DOC_LINKS_BASE, GITHUB_BASE_REF
- Related tests: none
