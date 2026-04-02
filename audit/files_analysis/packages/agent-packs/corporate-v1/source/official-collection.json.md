# packages/agent-packs/corporate-v1/source/official-collection.json

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

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
- Top level: packages
- Size: 512661 bytes
- SHA-256: 464825dcc3f386564153e66ed550456642323aa6db9180932c4e9770ecacd2fc
- Direct imports/refs: none
- Env vars: none
- Related tests: none
