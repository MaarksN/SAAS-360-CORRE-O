# scripts/testing/generate-performance-report.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: ../ci/shared.mjs, node:fs, node:path
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
- Language: JavaScript
- Top level: scripts
- Size: 1864 bytes
- SHA-256: 0183d116b6d099a9b76e37c1c3430f029c0b6c031040e16498b02623f06fbe5d
- Direct imports/refs: ../ci/shared.mjs, node:fs, node:path
- Env vars: none
- Related tests: none
