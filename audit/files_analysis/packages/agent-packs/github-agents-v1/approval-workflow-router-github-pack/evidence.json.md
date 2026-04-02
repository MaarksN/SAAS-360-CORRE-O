# packages/agent-packs/github-agents-v1/approval-workflow-router-github-pack/evidence.json

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
- Size: 1258 bytes
- SHA-256: b6b161d69f01f0a5a89f5736b162f87450588bfae86eb3db7a750ec0bdb5ccf1
- Direct imports/refs: none
- Env vars: none
- Related tests: tests/e2e/workflow-editor-evidence.spec.ts
