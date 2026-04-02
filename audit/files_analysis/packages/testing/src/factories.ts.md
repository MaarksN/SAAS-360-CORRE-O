# packages/testing/src/factories.ts

## Purpose
- Executable source under packages. Declares exports such as createMembership, createOrganization, createUser, seedCoreFixtures.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: @birthub/database
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
- Size: 1934 bytes
- SHA-256: 6f096ebcff4b5f45ae2be50d6e6cea26c78bf02112e09987776ac2e300c6428a
- Direct imports/refs: @birthub/database
- Env vars: none
- Related tests: none
