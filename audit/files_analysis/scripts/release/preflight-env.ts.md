# scripts/release/preflight-env.ts

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: @birthub/config, node:fs/promises, node:path
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 2 time(s) in runtime code.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 52/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: scripts
- Size: 4634 bytes
- SHA-256: f0b46a345fa9cd5f6770315f1e7bead8a91a3b86fc455fb9e1a81675f683d188
- Direct imports/refs: @birthub/config, node:fs/promises, node:path
- Env vars: none
- Related tests: none
