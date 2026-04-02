# scripts/performance/web-vitals-baseline.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: @playwright/test, node:child_process, node:fs, node:path, node:url
- Env vars: SKIP_WEB_SERVER, WEB_PORT
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 2 time(s) in runtime code.
- direct_env_access: Reads environment variables directly outside the shared config surface.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 62/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: scripts
- Size: 7154 bytes
- SHA-256: 7abc3ed3f74dcf63a65af0074b96a7c4f61951b424b9ef5d63b271bfcc058f0d
- Direct imports/refs: @playwright/test, node:child_process, node:fs, node:path, node:url
- Env vars: SKIP_WEB_SERVER, WEB_PORT
- Related tests: none
