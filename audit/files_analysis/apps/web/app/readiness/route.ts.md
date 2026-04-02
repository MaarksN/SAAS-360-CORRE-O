# apps/web/app/readiness/route.ts

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
- Size: 1116 bytes
- SHA-256: e41e820e6d76e84b82a1afed6339deaad02def60bd40ac42aebb472a7bf4bf11
- Direct imports/refs: ../../lib/operational-health, @birthub/logger, next/server
- Env vars: none
- Related tests: apps/web/tests/auth-session-route.test.ts, tests/e2e/critical-routes.spec.ts
