# packages/integrations/src/clients/http.ts

## Purpose
- Executable source under packages. Declares exports such as HttpRequestOptions, postJson.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: apps/worker/src/engine/runner.http.msw.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 27/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 2029 bytes
- SHA-256: 7866576aaba97fc133a39f08f8ed7934c998651d2ab9d0ab3a249ed791190830
- Direct imports/refs: none
- Env vars: none
- Related tests: apps/worker/src/engine/runner.http.msw.test.ts
