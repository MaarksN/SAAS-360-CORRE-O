# scripts/release/final-data-migration.ts

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: @birthub/database, bcryptjs, node:fs/promises, node:path
- Env vars: DATABASE_URL, LEGACY_AUTH_SAMPLE_PASSWORD
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
- Language: TypeScript
- Top level: scripts
- Size: 7926 bytes
- SHA-256: 01498811217155b929a6a7a01f3a503d7338659055bb22b7b1b17e8b0e1e0a60
- Direct imports/refs: @birthub/database, bcryptjs, node:fs/promises, node:path
- Env vars: DATABASE_URL, LEGACY_AUTH_SAMPLE_PASSWORD
- Related tests: none
