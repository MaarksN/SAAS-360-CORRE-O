# apps/web/next-env.d.ts

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: ./.next/types/routes.d.ts
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 50/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 247 bytes
- SHA-256: 7b550dda9686c16f36a17bf9051d5dbf31e98555b30d114ac49fc49a1e712651
- Direct imports/refs: ./.next/types/routes.d.ts
- Env vars: none
- Related tests: none
