# apps/web/tests/health.required-dependency.test.ts

## Purpose
- Automated verification asset for runtime or package behavior.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: ../app/health/route, node:assert/strict, node:test
- Env vars: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_ENVIRONMENT
- Related tests: apps/web/tests/health.required-dependency.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- No heuristic issues were triggered by the static scan.

## Risk Score
- 5/100

## Status
- OK

## Evidence
- Kind: test
- Language: TypeScript
- Top level: apps
- Size: 1712 bytes
- SHA-256: 4a66177ea63c36d16b4d0de0d590ac4e41449c7431279c84d02a3c0f92c28409
- Direct imports/refs: ../app/health/route, node:assert/strict, node:test
- Env vars: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_ENVIRONMENT
- Related tests: apps/web/tests/health.required-dependency.test.ts
