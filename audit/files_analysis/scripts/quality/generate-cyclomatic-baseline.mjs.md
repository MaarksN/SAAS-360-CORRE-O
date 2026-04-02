# scripts/quality/generate-cyclomatic-baseline.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: node:child_process, node:fs, node:path, typescript
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 1 time(s) in runtime code.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 47/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: scripts
- Size: 6154 bytes
- SHA-256: c114f555742b1bd58cf940a54f071eee764114714a80b84961482c9f9351aff0
- Direct imports/refs: node:child_process, node:fs, node:path, typescript
- Env vars: none
- Related tests: none
