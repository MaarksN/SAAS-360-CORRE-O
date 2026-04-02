# apps/web/lib/operational-health.ts

## Purpose
- Executable source under apps. Declares exports such as WebDependencyCheck, WebOperationalHealth, evaluateWebOperationalHealth.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: @birthub/config
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
- Size: 2446 bytes
- SHA-256: 701cf2f77a8bfd8acf8109d5683d0a57453984a0a661c40aa09deb542521b539
- Direct imports/refs: @birthub/config
- Env vars: none
- Related tests: none
