# packages/agents-core/src/tools/__mocks__/connectors.mock.ts

## Purpose
- Executable source under packages. Declares exports such as connectorMocks.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ../calendar.tool.js, ../crm.tool.js, ../email.tool.js, ../slack.tool.js, ../storage.tool.js
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
- Top level: packages
- Size: 1044 bytes
- SHA-256: f0348fa9ad34e1f0453e40a3dcf571eebad9ae60c3266134d9f563ef689479dc
- Direct imports/refs: ../calendar.tool.js, ../crm.tool.js, ../email.tool.js, ../slack.tool.js, ../storage.tool.js
- Env vars: none
- Related tests: none
