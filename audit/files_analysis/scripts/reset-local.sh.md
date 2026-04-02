# scripts/reset-local.sh

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 42/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: Shell
- Top level: scripts
- Size: 800 bytes
- SHA-256: d750e3a4848ad2b48c8427ed6e3fec840e58e41abe11d91aae108935962907a7
- Direct imports/refs: none
- Env vars: none
- Related tests: none
