# packages/database/prisma/seeds/shared.ts

## Purpose
- Executable source under packages. No explicit named exports detected.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./shared-foundation.js, ./shared-ops.js, ./shared-runtime.js
- Env vars: none
- Related tests: agents/shared/tests/conftest.py, agents/shared/tests/test_base_agent.py, agents/shared/tests/test_commercial_playbook_prompts.py, agents/shared/tests/test_db_pool.py, agents/shared/tests/test_operational_contract.py, agents/shared/tests/test_rate_limiter.py, apps/worker/src/agents/runtime.shared.test.ts, packages/shared-types/src/index.test.ts

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
- Size: 375 bytes
- SHA-256: e30c91f0e941c5aca4309e1036e8227a20f258cce4dd19f0cca69238867e21a8
- Direct imports/refs: ./shared-foundation.js, ./shared-ops.js, ./shared-runtime.js
- Env vars: none
- Related tests: agents/shared/tests/conftest.py, agents/shared/tests/test_base_agent.py, agents/shared/tests/test_commercial_playbook_prompts.py, agents/shared/tests/test_db_pool.py, agents/shared/tests/test_operational_contract.py, agents/shared/tests/test_rate_limiter.py, apps/worker/src/agents/runtime.shared.test.ts, packages/shared-types/src/index.test.ts
