# apps/worker/src/integrations/connectors.runtime.ts

## Purpose
- Executable source under apps. Declares exports such as executeConnectorRuntimeAction.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ../agents/conversations.js, ./hubspot.js, @birthub/database, @birthub/workflows-core
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
- Size: 9156 bytes
- SHA-256: d73f3ea64fad81979b6ddbb5479da92357f6045cf7eff4e86a71a285898152e4
- Direct imports/refs: ../agents/conversations.js, ./hubspot.js, @birthub/database, @birthub/workflows-core
- Env vars: none
- Related tests: none
