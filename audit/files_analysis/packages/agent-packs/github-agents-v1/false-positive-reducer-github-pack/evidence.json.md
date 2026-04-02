# packages/agent-packs/github-agents-v1/false-positive-reducer-github-pack/evidence.json

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
- Size: 1238 bytes
- SHA-256: 6a39ce693694b8cf5f4758a82a194eb42e344a62962e2640ee7e57c472ed79b9
- Direct imports/refs: none
- Env vars: none
- Related tests: tests/e2e/workflow-editor-evidence.spec.ts
