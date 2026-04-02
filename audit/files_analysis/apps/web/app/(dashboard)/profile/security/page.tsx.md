# apps/web/app/(dashboard)/profile/security/page.tsx

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: ../../../../lib/auth-client, ../../../../lib/dompurify, @birthub/config, react
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
- Size: 4655 bytes
- SHA-256: 1d2216a87863d2d895a6655f61ed340c3db3480191e2ed0205d8ac2bfe0c6b88
- Direct imports/refs: ../../../../lib/auth-client, ../../../../lib/dompurify, @birthub/config, react
- Env vars: none
- Related tests: none
