# apps/api/src/app/core.ts

## Purpose
- Executable source under apps. Declares exports such as configureAppInfrastructure, registerGlobalErrorHandling, registerOperationalRoutes.

## Architectural Role
- API layer component.

## Dependencies
- Imports/refs: ../common/cache/index.js, ../docs/openapi.js, ../lib/health.js, ../lib/problem-details.js, ../metrics.js, ../middleware/authentication.js, ../middleware/content-type.js, ../middleware/csrf.js, +15 more
- Env vars: none
- Related tests: agents/ldr/tests/test_score_icp_weighted.py, apps/worker/src/jobs/healthScore.test.ts, packages/agents-core/src/__tests__/agent-api-manifest-parser.test.ts, packages/agents-core/src/__tests__/catalog.test.ts, packages/agents-core/src/__tests__/manifest-parser.test.ts, packages/agents-core/test/parser.test.ts, packages/agents-core/test/policy.test.ts, packages/agents-core/test/policyEngine.test.ts

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
- Size: 8009 bytes
- SHA-256: 9516c70a33816b60d4a59c3f61d9450b576f31c46a197d5a94cb5b459591040c
- Direct imports/refs: ../common/cache/index.js, ../docs/openapi.js, ../lib/health.js, ../lib/problem-details.js, ../metrics.js, ../middleware/authentication.js, ../middleware/content-type.js, ../middleware/csrf.js, +15 more
- Env vars: none
- Related tests: agents/ldr/tests/test_score_icp_weighted.py, apps/worker/src/jobs/healthScore.test.ts, packages/agents-core/src/__tests__/agent-api-manifest-parser.test.ts, packages/agents-core/src/__tests__/catalog.test.ts, packages/agents-core/src/__tests__/manifest-parser.test.ts, packages/agents-core/test/parser.test.ts, packages/agents-core/test/policy.test.ts, packages/agents-core/test/policyEngine.test.ts
