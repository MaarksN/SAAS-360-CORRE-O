# packages/agent-packs/github-agents-v1/validation-rule-enforcer-github-pack/evidence.json

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
- No heuristic issues were triggered by the static scan.

## Risk Score
- 15/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: JSON
- Top level: packages
- Size: 1258 bytes
- SHA-256: 0de4e6571c3c5a45a927c01a42ac753da1d8b56d80b3e5b9b489e11d5ee643c8
- Direct imports/refs: none
- Env vars: none
- Related tests: tests/e2e/workflow-editor-evidence.spec.ts
