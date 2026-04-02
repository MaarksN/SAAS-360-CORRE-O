# apps/worker/src/integrations/hubspot.ts

## Purpose
- Executable source under apps. Declares exports such as HubspotRateLimitError, syncOrganizationToHubspot.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: @birthub/config, @birthub/database, @birthub/logger
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
- Size: 5655 bytes
- SHA-256: 08e9645931726597659e922d1dafae70189e39b2ca465e180c27d70b8de0b9c8
- Direct imports/refs: @birthub/config, @birthub/database, @birthub/logger
- Env vars: none
- Related tests: none
