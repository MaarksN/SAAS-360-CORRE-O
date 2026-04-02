# apps/api/src/modules/connectors/service.shared.ts

## Purpose
- Executable source under apps. Declares exports such as ConnectorCredentialsRecord, ConnectorOauthState, ConnectorProvider, buildAuthorizationUrl, buildOauthState, +7 more.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../../lib/encryption.js, ../../lib/problem-details.js, @birthub/config, @birthub/database
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
- Size: 9407 bytes
- SHA-256: 05ca1a7d9476a2dd2071d2b858426bd30e2bcd0b99af7b1ddeef53e188a892fd
- Direct imports/refs: ../../lib/encryption.js, ../../lib/problem-details.js, @birthub/config, @birthub/database
- Env vars: none
- Related tests: none
