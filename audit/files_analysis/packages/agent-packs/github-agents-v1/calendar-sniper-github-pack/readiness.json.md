# packages/agent-packs/github-agents-v1/calendar-sniper-github-pack/readiness.json

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
- Size: 2464 bytes
- SHA-256: 21b4ccf3d7c9d7af7db78fbcc51c5fbc0380ed43a387acde3901f2544f83c4e8
- Direct imports/refs: none
- Env vars: none
- Related tests: apps/worker/test/readiness.required-dependency.test.ts, packages/agent-packs/test/github-collection-readiness.test.ts
