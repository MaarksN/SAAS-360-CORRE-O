# scripts/ci/script-compliance-policy.json

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
- Language: JSON
- Top level: scripts
- Size: 9688 bytes
- SHA-256: cd0a7aa0506caa18f867ab7f7c78f3a6025e0945a5b0f767094ddeaf6ef4828e
- Direct imports/refs: none
- Env vars: none
- Related tests: none
