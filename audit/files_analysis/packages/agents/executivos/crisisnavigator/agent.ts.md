# packages/agents/executivos/crisisnavigator/agent.ts

## Purpose
- Executable source under packages. Declares exports such as CrisisNavigatorAgent.

## Architectural Role
- Shared package surface used across the monorepo.

## Dependencies
- Imports/refs: ./schemas.js, ./tools.js, node:fs/promises, node:path
- Env vars: none
- Related tests: agents/account_manager/tests/test_agent.py, agents/account_manager/tests/test_tools.py, agents/ae/tests/test_ae_agent.py, agents/ae/tests/test_ae_tools.py, agents/ae/tests/test_agent.py, agents/analista/tests/test_agent.py, agents/analista/tests/test_tools.py, agents/closer/tests/test_agent.py

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- console_logging: Uses console-based logging 3 time(s) in runtime code.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 42/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: packages
- Size: 26407 bytes
- SHA-256: a72b25d3b38885f4f2b842873eac941f09d5c264d615af46803a6695235f6b14
- Direct imports/refs: ./schemas.js, ./tools.js, node:fs/promises, node:path
- Env vars: none
- Related tests: agents/account_manager/tests/test_agent.py, agents/account_manager/tests/test_tools.py, agents/ae/tests/test_ae_agent.py, agents/ae/tests/test_ae_tools.py, agents/ae/tests/test_agent.py, agents/analista/tests/test_agent.py, agents/analista/tests/test_tools.py, agents/closer/tests/test_agent.py
