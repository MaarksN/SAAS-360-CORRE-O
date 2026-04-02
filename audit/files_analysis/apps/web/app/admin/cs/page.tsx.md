# apps/web/app/admin/cs/page.tsx

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: ../../../lib/auth-client, react
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 42/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 3787 bytes
- SHA-256: 5b4708ce00f2a3d82b5961e17aa94b8eefe4e43060bc67c1a83c667a506a02ab
- Direct imports/refs: ../../../lib/auth-client, react
- Env vars: none
- Related tests: none
