# packages/agent-packs/github-agents-v1/demo-sandboxer-github-pack/readiness.json

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
- Size: 2456 bytes
- SHA-256: b4ce65a58a3293cfddc0e96e3c45602c8ae9ac7f89b215fd3a05816b0c84abac
- Direct imports/refs: none
- Env vars: none
- Related tests: apps/worker/test/readiness.required-dependency.test.ts, packages/agent-packs/test/github-collection-readiness.test.ts
