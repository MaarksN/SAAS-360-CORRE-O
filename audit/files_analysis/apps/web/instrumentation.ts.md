# apps/web/instrumentation.ts

## Purpose
- Executable source under apps. Declares exports such as register.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: none
- Env vars: NEXT_RUNTIME
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- direct_env_access: Reads environment variables directly outside the shared config surface.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 40/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 132 bytes
- SHA-256: f6ca3c068550e320b290e46b516cce2024d8e46cb1700085e5dec6ee3f5c0180
- Direct imports/refs: none
- Env vars: NEXT_RUNTIME
- Related tests: none
