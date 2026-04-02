# scripts/audit/shared.mjs

## Purpose
- Executable source under scripts. Declares exports such as analysisOutputPath, auditRoot, classifyKind, countMatches, defaultBackupRoot, +22 more.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: node:child_process, node:crypto, node:fs, node:path, node:url
- Env vars: none
- Related tests: agents/shared/tests/conftest.py, agents/shared/tests/test_base_agent.py, agents/shared/tests/test_commercial_playbook_prompts.py, agents/shared/tests/test_db_pool.py, agents/shared/tests/test_operational_contract.py, agents/shared/tests/test_rate_limiter.py, apps/worker/src/agents/runtime.shared.test.ts, packages/shared-types/src/index.test.ts

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
- Language: JavaScript
- Top level: scripts
- Size: 8292 bytes
- SHA-256: 2617c9c9014659866086784e3a51b2536a278209f5c46af6ac5ce549a26895c2
- Direct imports/refs: node:child_process, node:crypto, node:fs, node:path, node:url
- Env vars: none
- Related tests: agents/shared/tests/conftest.py, agents/shared/tests/test_base_agent.py, agents/shared/tests/test_commercial_playbook_prompts.py, agents/shared/tests/test_db_pool.py, agents/shared/tests/test_operational_contract.py, agents/shared/tests/test_rate_limiter.py, apps/worker/src/agents/runtime.shared.test.ts, packages/shared-types/src/index.test.ts
