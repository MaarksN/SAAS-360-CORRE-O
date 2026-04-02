# packages/shared-types/src/schemas/leads.ts

## Purpose
- Executable source under packages. Declares exports such as LeadInput, LeadSchema, QueueName.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: zod
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
- Top level: packages
- Size: 1761 bytes
- SHA-256: 94c9b97f84988bf6ce72d3ddde09dfa688eb41654fdd9bd81224e3097a7f767d
- Direct imports/refs: zod
- Env vars: none
- Related tests: none
