# apps/web/app/api/bff/policy.ts

## Purpose
- Executable source under apps. Declares exports such as ALLOWED_BFF_PREFIXES, isBffPathAllowed.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: packages/agents-core/test/policy.test.ts, packages/agents-core/test/policyEngine.test.ts

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
- Top level: apps
- Size: 262 bytes
- SHA-256: 0f3d589c8fb5d39f8e1a4f859ff8720899e55f42ab01e9275e98ebff3efe3a25
- Direct imports/refs: none
- Env vars: none
- Related tests: packages/agents-core/test/policy.test.ts, packages/agents-core/test/policyEngine.test.ts
