# packages/agent-packs/github-agents-v1/cannibalization-detector-github-pack/evidence.json

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
- Size: 1260 bytes
- SHA-256: 8a06f600f7c4b282b6026b4961823a7416044d3a90af92a6e260fe3d03413a5b
- Direct imports/refs: none
- Env vars: none
- Related tests: tests/e2e/workflow-editor-evidence.spec.ts
