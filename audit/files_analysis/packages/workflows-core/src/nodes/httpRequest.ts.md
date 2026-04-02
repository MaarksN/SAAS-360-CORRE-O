# packages/workflows-core/src/nodes/httpRequest.ts

## Purpose
- Executable source under packages. Declares exports such as executeHttpRequestNode.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../interpolation/interpolate.js, ../types.js, lru-cache, node:crypto, opossum
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 42/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 4220 bytes
- SHA-256: 28906b5a2a997862dfe8146d3b904cc1a5eede461fcfc005f0a02a63bdffdcc4
- Direct imports/refs: ../interpolation/interpolate.js, ../types.js, lru-cache, node:crypto, opossum
- Env vars: none
- Related tests: none
