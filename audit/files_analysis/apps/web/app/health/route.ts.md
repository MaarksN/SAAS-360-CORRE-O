# apps/web/app/health/route.ts

## Purpose
- Executable source under apps. Declares exports such as GET, dynamic.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: ../../lib/operational-health, @birthub/logger, next/server
- Env vars: none
- Related tests: apps/web/tests/auth-session-route.test.ts, tests/e2e/critical-routes.spec.ts

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
- Size: 1069 bytes
- SHA-256: 5af39d4d306e30c27f8e60222fe2a7338faa7bd582996373729f4c681068d0be
- Direct imports/refs: ../../lib/operational-health, @birthub/logger, next/server
- Env vars: none
- Related tests: apps/web/tests/auth-session-route.test.ts, tests/e2e/critical-routes.spec.ts
