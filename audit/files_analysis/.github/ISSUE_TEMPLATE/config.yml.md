# .github/ISSUE_TEMPLATE/config.yml

## Purpose
- Executable source under .github. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: none
- Env vars: none
- Related tests: apps/api/tests/test-config.ts, packages/config/src/api.config.test.ts, packages/config/src/web.config.test.ts, packages/config/src/worker.config.test.ts

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
- Language: YAML
- Top level: .github
- Size: 29 bytes
- SHA-256: a0adec10c3e2c09efb3f1a70798bd487937d322285014f522f6a73e8e2ad9123
- Direct imports/refs: none
- Env vars: none
- Related tests: apps/api/tests/test-config.ts, packages/config/src/api.config.test.ts, packages/config/src/web.config.test.ts, packages/config/src/worker.config.test.ts
