# apps/web/components/login-form.tsx

## Purpose
- Executable source under apps. Declares exports such as LoginForm, LoginFormProps.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: next/navigation, react
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 62/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 6004 bytes
- SHA-256: f95d8973eaaf9cb558555aaa6490f79117123118ed40aa1a2269779fc2ff5204
- Direct imports/refs: next/navigation, react
- Env vars: none
- Related tests: none
