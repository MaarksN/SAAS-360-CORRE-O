# apps/api/src/docs/openapi.ts

## Purpose
- Executable source under apps. Declares exports such as openApiDocument.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: none
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
- Size: 829 bytes
- SHA-256: df49958bf3e50ba62cb035dcf33020516049ce6448cdf9cb69fd224d7e6385e5
- Direct imports/refs: none
- Env vars: none
- Related tests: none
