# packages/agent-packs/github-agents-v1/vendor-negotiator-github-pack/readiness.json

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: apps/worker/test/readiness.required-dependency.test.ts, packages/agent-packs/test/github-collection-readiness.test.ts

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
- Size: 2480 bytes
- SHA-256: 908212d8671a015f8141476f3a9b9d7ae187d928b1c4dd4cff00f3b631ee48aa
- Direct imports/refs: none
- Env vars: none
- Related tests: apps/worker/test/readiness.required-dependency.test.ts, packages/agent-packs/test/github-collection-readiness.test.ts
