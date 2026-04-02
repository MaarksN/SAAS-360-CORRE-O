# apps/worker/src/jobs/healthScore.ts

## Purpose
- Executable source under apps. Declares exports such as HealthScoreInputs, calculateHealthScore, clampHealthScore, computeAndPersistHealthScores, refreshTenantActivityWindows, +1 more.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ../events/internalEventBus.js, ../integrations/hubspot.js, @birthub/database, @birthub/logger
- Env vars: none
- Related tests: apps/worker/src/jobs/healthScore.test.ts

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
- Language: TypeScript
- Top level: apps
- Size: 6656 bytes
- SHA-256: 2ba118fb0b37de081019b92bb906be693b4f137159e5edd4aa0a32c0adf9b764
- Direct imports/refs: ../events/internalEventBus.js, ../integrations/hubspot.js, @birthub/database, @birthub/logger
- Env vars: none
- Related tests: apps/worker/src/jobs/healthScore.test.ts
