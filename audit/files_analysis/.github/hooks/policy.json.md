# .github/hooks/policy.json

## Purpose
- Executable source under .github. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: packages/agents-core/test/policy.test.ts, packages/agents-core/test/policyEngine.test.ts

## Operational Relevance
- Included in the SaaS score.

## Problems
- No heuristic issues were triggered by the static scan.

## Risk Score
- 15/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: JSON
- Top level: .github
- Size: 333 bytes
- SHA-256: c959342abc6fcd227927ec0c3c53ebc22d035cee948f92590991b24c89737f1f
- Direct imports/refs: none
- Env vars: none
- Related tests: packages/agents-core/test/policy.test.ts, packages/agents-core/test/policyEngine.test.ts
