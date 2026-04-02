# packages/queue/src/workers/campaign-worker.ts

## Purpose
- Executable source under packages. Declares exports such as CampaignJobPayload, CampaignWorker.

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
- Size: 385 bytes
- SHA-256: fc4ef379bb470f2b87ad819b44c4876f15ffd7d11274512ddd56bea432b05cc2
- Direct imports/refs: ./base-worker
- Env vars: none
- Related tests: none
