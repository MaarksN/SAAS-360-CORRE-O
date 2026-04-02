# scripts/ci/shared.mjs

## Purpose
- Executable source under scripts. Declares exports such as buildEnv, capturePnpm, commandVersion, formatNow, portableCorepackHome, +8 more.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: node:child_process, node:fs, node:path, node:url
- Env vars: APPDATA, COREPACK_HOME, LOCALAPPDATA, P, PATH, USERPROFILE
- Related tests: agents/shared/tests/conftest.py, agents/shared/tests/test_base_agent.py, agents/shared/tests/test_commercial_playbook_prompts.py, agents/shared/tests/test_db_pool.py, agents/shared/tests/test_operational_contract.py, agents/shared/tests/test_rate_limiter.py, apps/worker/src/agents/runtime.shared.test.ts, packages/shared-types/src/index.test.ts

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 1 time(s) in runtime code.
- direct_env_access: Reads environment variables directly outside the shared config surface.

## Risk Score
- 30/100

## Status
- OK

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: scripts
- Size: 7103 bytes
- SHA-256: 0900b9a073836abbcc1f6319bb7cc4bd870c956c1dddd5ed2640cfa028a6934d
- Direct imports/refs: node:child_process, node:fs, node:path, node:url
- Env vars: APPDATA, COREPACK_HOME, LOCALAPPDATA, P, PATH, USERPROFILE
- Related tests: agents/shared/tests/conftest.py, agents/shared/tests/test_base_agent.py, agents/shared/tests/test_commercial_playbook_prompts.py, agents/shared/tests/test_db_pool.py, agents/shared/tests/test_operational_contract.py, agents/shared/tests/test_rate_limiter.py, apps/worker/src/agents/runtime.shared.test.ts, packages/shared-types/src/index.test.ts
