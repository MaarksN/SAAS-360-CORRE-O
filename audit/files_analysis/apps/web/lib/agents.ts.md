# apps/web/lib/agents.ts

## Purpose
- Executable source under apps. Declares exports such as AgentExecutionRow, AgentPoliciesSnapshot, AgentSnapshot, ExecutionStatus, ManagedPolicySnapshot, +3 more.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: @birthub/config, next/headers
- Env vars: none
- Related tests: agents/account_manager/tests/test_agent.py, agents/account_manager/tests/test_tools.py, agents/ae/tests/test_ae_agent.py, agents/ae/tests/test_ae_tools.py, agents/ae/tests/test_agent.py, agents/analista/tests/test_agent.py, agents/analista/tests/test_tools.py, agents/closer/tests/test_agent.py

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- limited_observability: Runtime side effects appear without structured logging or metrics in the same file.

## Risk Score
- 47/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: apps
- Size: 3625 bytes
- SHA-256: 32c0d9c87d3b6d330de63da9fce687555834e07be66fd597bfaf5ed31212859c
- Direct imports/refs: @birthub/config, next/headers
- Env vars: none
- Related tests: agents/account_manager/tests/test_agent.py, agents/account_manager/tests/test_tools.py, agents/ae/tests/test_ae_agent.py, agents/ae/tests/test_ae_tools.py, agents/ae/tests/test_agent.py, agents/analista/tests/test_agent.py, agents/analista/tests/test_tools.py, agents/closer/tests/test_agent.py
