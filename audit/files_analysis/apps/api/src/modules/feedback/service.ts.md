# apps/api/src/modules/feedback/service.ts

## Purpose
- Executable source under apps. Declares exports such as getExecutionFeedback, saveExecutionFeedback.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/problem-details.js, ../auth/auth.service.js, @birthub/database
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
- Size: 3168 bytes
- SHA-256: 477ad28d20f23db951a94859bd9623776834af1c7a9272dfdbe05a0b37062b5b
- Direct imports/refs: ../../lib/problem-details.js, ../auth/auth.service.js, @birthub/database
- Env vars: none
- Related tests: apps/api/tests/metrics.service.test.ts, packages/conversation-core/src/__tests__/service.test.ts
