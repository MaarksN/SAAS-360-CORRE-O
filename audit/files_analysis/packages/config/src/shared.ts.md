# packages/config/src/shared.ts

## Purpose
- Executable source under packages. Declares exports such as EnvValidationError, commaSeparatedList, deploymentEnvironmentSchema, envBoolean, hasPlaceholderMarker, +12 more.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: zod
- Env vars: none
- Related tests: agents/shared/tests/conftest.py, agents/shared/tests/test_base_agent.py, agents/shared/tests/test_commercial_playbook_prompts.py, agents/shared/tests/test_db_pool.py, agents/shared/tests/test_operational_contract.py, agents/shared/tests/test_rate_limiter.py, apps/worker/src/agents/runtime.shared.test.ts, packages/shared-types/src/index.test.ts

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- network_without_timeout: External network operations do not show an explicit timeout or abort path.

## Risk Score
- 35/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 3402 bytes
- SHA-256: a455f53b0d33e0c40d13356609cfbec6cb4f41db49db35caabc311acd3729588
- Direct imports/refs: zod
- Env vars: none
- Related tests: agents/shared/tests/conftest.py, agents/shared/tests/test_base_agent.py, agents/shared/tests/test_commercial_playbook_prompts.py, agents/shared/tests/test_db_pool.py, agents/shared/tests/test_operational_contract.py, agents/shared/tests/test_rate_limiter.py, apps/worker/src/agents/runtime.shared.test.ts, packages/shared-types/src/index.test.ts
