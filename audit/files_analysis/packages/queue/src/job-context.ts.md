# packages/queue/src/job-context.ts

## Purpose
- Executable source under packages. Declares exports such as IJobContext, signJobPayload, validateJobContext, verifyJobPayloadSignature.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: node:crypto
- Env vars: none
- Related tests: packages/queue/tests/job-context.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- No heuristic issues were triggered by the static scan.

## Risk Score
- 15/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 704 bytes
- SHA-256: 502f3194b339e6db9d37a97373d92485d59c396e21111be980840dee60c0003e
- Direct imports/refs: node:crypto
- Env vars: none
- Related tests: packages/queue/tests/job-context.test.ts
