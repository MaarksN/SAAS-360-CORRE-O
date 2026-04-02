# scripts/migrate-to-multitenant.ts

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: @prisma/client
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
- Size: 3257 bytes
- SHA-256: ce3311c137de7ad9353af51f8a70d81f02993ed25ff6e5952ebe59dc3c26823c
- Direct imports/refs: @prisma/client
- Env vars: none
- Related tests: none
