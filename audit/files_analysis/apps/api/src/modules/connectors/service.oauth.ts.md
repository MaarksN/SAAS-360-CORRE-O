# apps/api/src/modules/connectors/service.oauth.ts

## Purpose
- Executable source under apps. Declares exports such as createConnectSession, finalizeConnectSession.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/problem-details.js, ./service.shared.js, @birthub/config, @birthub/database
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
- Size: 5200 bytes
- SHA-256: f0a7abf2916cdf375eefcfc63c2f938baab5fec4fe1407865c52896b40981c98
- Direct imports/refs: ../../lib/problem-details.js, ./service.shared.js, @birthub/config, @birthub/database
- Env vars: none
- Related tests: none
