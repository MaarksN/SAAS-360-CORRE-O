# scripts/sync-birthhub-html.ts

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: jsdom, node:fs/promises, node:path, node:url
- Env vars: BIRTHHUB_HTML_PATH
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 1 time(s) in runtime code.
- direct_env_access: Reads environment variables directly outside the shared config surface.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 45/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: scripts
- Size: 5188 bytes
- SHA-256: c809b9c6c853e511f426efe19c1ffcb39931bbb05f5bf3c00eb5dae8f3a5b0f2
- Direct imports/refs: jsdom, node:fs/promises, node:path, node:url
- Env vars: BIRTHHUB_HTML_PATH
- Related tests: none
