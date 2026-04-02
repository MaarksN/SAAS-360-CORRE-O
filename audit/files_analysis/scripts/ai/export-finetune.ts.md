# scripts/ai/export-finetune.ts

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: @birthub/database, node:crypto, node:fs/promises, node:path
- Env vars: DATABASE_URL, DATASET_EXPORT_UPLOAD_TOKEN, DATASET_EXPORT_UPLOAD_URL
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 2 time(s) in runtime code.
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- direct_env_access: Reads environment variables directly outside the shared config surface.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 82/100

## Status
- CRITICO

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: scripts
- Size: 4352 bytes
- SHA-256: 0772fb74e8d25fe24249cdf065ed56842fdd807811fef6567ffcbca59a423629
- Direct imports/refs: @birthub/database, node:crypto, node:fs/promises, node:path
- Env vars: DATABASE_URL, DATASET_EXPORT_UPLOAD_TOKEN, DATASET_EXPORT_UPLOAD_URL
- Related tests: none
