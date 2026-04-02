# packages/agents/executivos/culturepulse/agent.ts

## Purpose
- Executable source under packages. Declares exports such as CulturePulseAgent.

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
- Size: 25982 bytes
- SHA-256: 543e7b0922165217eec895bd56663035794c7e63506fdb1a53c862706513cc36
- Direct imports/refs: ./schemas.js, ./tools.js, node:fs/promises, node:path
- Env vars: none
- Related tests: agents/account_manager/tests/test_agent.py, agents/account_manager/tests/test_tools.py, agents/ae/tests/test_ae_agent.py, agents/ae/tests/test_ae_tools.py, agents/ae/tests/test_agent.py, agents/analista/tests/test_agent.py, agents/analista/tests/test_tools.py, agents/closer/tests/test_agent.py
