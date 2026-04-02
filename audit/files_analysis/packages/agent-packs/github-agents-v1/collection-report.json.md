# packages/agent-packs/github-agents-v1/collection-report.json

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
- Size: 139785 bytes
- SHA-256: 7be0478a5b1fb7264b5f95063de5a5f55dc72902ba90eca6b67cb5044fb24d6c
- Direct imports/refs: none
- Env vars: none
- Related tests: none
