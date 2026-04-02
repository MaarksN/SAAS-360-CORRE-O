# packages/agent-packs/github-agents-v1/credit-score-fetcher-github-pack/evidence.json

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: tests/e2e/workflow-editor-evidence.spec.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 27/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: JSON
- Top level: packages
- Size: 1218 bytes
- SHA-256: 46a59ad5fa262ccc2a8ca3ac8af4dad1d2503b058acf291616acc36c53dcc426
- Direct imports/refs: none
- Env vars: none
- Related tests: tests/e2e/workflow-editor-evidence.spec.ts
