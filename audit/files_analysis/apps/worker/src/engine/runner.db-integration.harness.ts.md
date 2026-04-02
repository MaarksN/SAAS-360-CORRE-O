# apps/worker/src/engine/runner.db-integration.harness.ts

## Purpose
- Executable source under apps. No explicit named exports detected.

## Architectural Role
- Background worker and queue execution component.

## Dependencies
- Imports/refs: ./runner.js
- Env vars: WORKFLOW_TEST_EXECUTION_ID, WORKFLOW_TEST_ORGANIZATION_ID, WORKFLOW_TEST_STEP_KEY, WORKFLOW_TEST_TENANT_ID, WORKFLOW_TEST_TRIGGER_PAYLOAD, WORKFLOW_TEST_WORKFLOW_ID
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- direct_env_access: Reads environment variables directly outside the shared config surface.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 52/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 1820 bytes
- SHA-256: dda485246974c516c8fd17c064d223a94c6e92035bbb383fc57dc0eb13b16113
- Direct imports/refs: ./runner.js
- Env vars: WORKFLOW_TEST_EXECUTION_ID, WORKFLOW_TEST_ORGANIZATION_ID, WORKFLOW_TEST_STEP_KEY, WORKFLOW_TEST_TENANT_ID, WORKFLOW_TEST_TRIGGER_PAYLOAD, WORKFLOW_TEST_WORKFLOW_ID
- Related tests: none
