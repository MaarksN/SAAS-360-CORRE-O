# packages/queue/src/workers/agent-worker.ts

## Purpose
- Executable source under packages. Declares exports such as AgentJobPayload, AgentWorker.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./base-worker
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
- Size: 361 bytes
- SHA-256: ac2b66240373e3f5c32a893ceb336d2d3d02b32ce9b9bc25adcc8ae53fd57c7c
- Direct imports/refs: ./base-worker
- Env vars: none
- Related tests: none
