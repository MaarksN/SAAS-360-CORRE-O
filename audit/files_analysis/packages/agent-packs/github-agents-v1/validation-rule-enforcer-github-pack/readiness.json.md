# packages/agent-packs/github-agents-v1/validation-rule-enforcer-github-pack/readiness.json

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
- Size: 2535 bytes
- SHA-256: 39e7375044e58d27a962804ab0ec70504ce2f40c7ec3803ac9847f05927f9e56
- Direct imports/refs: none
- Env vars: none
- Related tests: apps/worker/test/readiness.required-dependency.test.ts, packages/agent-packs/test/github-collection-readiness.test.ts
