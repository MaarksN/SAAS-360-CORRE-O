# apps/worker/src/agents/runtime.db-integration.harness.ts

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ../../../api/src/modules/agents/metrics.service.js, ../../../api/src/modules/outputs/output.service.js, ./runtime.js, @birthub/database, @birthub/logger
- Env vars: RUNTIME_TEST_AGENT_ID, RUNTIME_TEST_EXECUTION_ID, RUNTIME_TEST_ORGANIZATION_ID, RUNTIME_TEST_TENANT_ID, RUNTIME_TEST_USER_ID
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- direct_env_access: Reads environment variables directly outside the shared config surface.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 40/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 4533 bytes
- SHA-256: 6b3dac27544c84a6b3f3a48cf7a606dfaae42106d44e5a966e50b8eff91528bc
- Direct imports/refs: ../../../api/src/modules/agents/metrics.service.js, ../../../api/src/modules/outputs/output.service.js, ./runtime.js, @birthub/database, @birthub/logger
- Env vars: RUNTIME_TEST_AGENT_ID, RUNTIME_TEST_EXECUTION_ID, RUNTIME_TEST_ORGANIZATION_ID, RUNTIME_TEST_TENANT_ID, RUNTIME_TEST_USER_ID
- Related tests: none
