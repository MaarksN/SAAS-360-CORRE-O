# apps/web/public/sw.js

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- Web application component.

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
- Language: JavaScript
- Top level: apps
- Size: 299 bytes
- SHA-256: 7b6ce512ff8e4da5a2194025d4277b9e3ac25243456042ae4ca23c0b21e05f85
- Direct imports/refs: none
- Env vars: none
- Related tests: apps/worker/src/engine/runner.http.msw.test.ts
