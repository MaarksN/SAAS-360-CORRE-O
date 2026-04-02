# apps/api/src/server.ts

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ./app.js, ./observability/otel.js, ./observability/sentry.js, @birthub/config, @birthub/logger
- Env vars: none
- Related tests: apps/voice-engine/src/server.test.ts

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
- Size: 866 bytes
- SHA-256: 73fa78eeff988fec50243e0a92c8f555a8deb1565a874d6005b9717392fe2d6a
- Direct imports/refs: ./app.js, ./observability/otel.js, ./observability/sentry.js, @birthub/config, @birthub/logger
- Env vars: none
- Related tests: apps/voice-engine/src/server.test.ts
