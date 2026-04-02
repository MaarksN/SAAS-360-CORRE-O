# scripts/diagnostics/check-ownership-governance.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: node:fs, node:path, node:url
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 3 time(s) in runtime code.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 57/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: scripts
- Size: 5981 bytes
- SHA-256: 7d14c1f4f3eee90b60140a2356e22d472dd778cead83b19e5c007cfa9e787b82
- Direct imports/refs: node:fs, node:path, node:url
- Env vars: none
- Related tests: none
