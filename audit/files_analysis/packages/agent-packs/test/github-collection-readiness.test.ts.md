# packages/agent-packs/test/github-collection-readiness.test.ts

## Purpose
- Automated verification asset for runtime or package behavior.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../../../scripts/agent/check-github-agent-readiness.ts, ../../../scripts/agent/compile-github-agents.ts, node:assert/strict, node:fs/promises, node:os, node:path, node:test, node:url
- Env vars: none
- Related tests: packages/agent-packs/test/github-collection-readiness.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- No heuristic issues were triggered by the static scan.

## Risk Score
- 5/100

## Status
- OK

## Evidence
- Kind: test
- Language: TypeScript
- Top level: packages
- Size: 2057 bytes
- SHA-256: 39938c3deaa302dcaba1d57a01eeeb103af46c59bc3ea563b4ea7c5be7bd4376
- Direct imports/refs: ../../../scripts/agent/check-github-agent-readiness.ts, ../../../scripts/agent/compile-github-agents.ts, node:assert/strict, node:fs/promises, node:os, node:path, node:test, node:url
- Env vars: none
- Related tests: packages/agent-packs/test/github-collection-readiness.test.ts
