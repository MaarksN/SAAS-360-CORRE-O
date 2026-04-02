# packages/integrations/src/clients/calendar.ts

## Purpose
- Executable source under packages. Declares exports such as GoogleCalendarClient.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./http
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
- Size: 888 bytes
- SHA-256: ee7e3a236a639f5f57c7f2aa9e2de07e8193f80c243f4b4a1276942b991ae0fd
- Direct imports/refs: ./http
- Env vars: none
- Related tests: none
