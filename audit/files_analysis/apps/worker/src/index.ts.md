# apps/worker/src/index.ts

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./alerts/failRateAlert.js, ./jobs/scheduler.js, ./jobs/userCleanup.js, ./observability/otel.js, ./operational/readiness.js, ./worker.js, @birthub/config, @birthub/logger, +1 more
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- network_without_timeout: External network operations do not show an explicit timeout or abort path.

## Risk Score
- 35/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 7845 bytes
- SHA-256: 095ad57abf82b15fb3c6f251a03cc52e8ad2668ba90111dc10b90471472d4382
- Direct imports/refs: ./alerts/failRateAlert.js, ./jobs/scheduler.js, ./jobs/userCleanup.js, ./observability/otel.js, ./operational/readiness.js, ./worker.js, @birthub/config, @birthub/logger, +1 more
- Env vars: none
- Related tests: packages/integrations/src/index.test.ts, packages/llm-client/src/index.test.ts, packages/logger/src/index.test.ts, packages/shared-types/src/index.test.ts, packages/shared/errors/index.test.ts
