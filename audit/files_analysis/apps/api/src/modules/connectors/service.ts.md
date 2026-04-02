# apps/api/src/modules/connectors/service.ts

## Purpose
- Executable source under apps. Declares exports such as connectorsService.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../engagement/queues.js, ./service.oauth.js, ./service.shared.js, @birthub/config, @birthub/database
- Env vars: none
- Related tests: apps/api/tests/metrics.service.test.ts, packages/conversation-core/src/__tests__/service.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 27/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 5516 bytes
- SHA-256: ea73a3f457f544fd902865eba95f02cc08f71573820b60c79c8fab4b7a382dcc
- Direct imports/refs: ../engagement/queues.js, ./service.oauth.js, ./service.shared.js, @birthub/config, @birthub/database
- Env vars: none
- Related tests: apps/api/tests/metrics.service.test.ts, packages/conversation-core/src/__tests__/service.test.ts
