# scripts/agent/check-github-agent-readiness.ts

## Purpose
- Executable source under scripts. Declares exports such as GithubAgentReadinessGateReport, verifyGithubAgentsReadiness.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: ./github-agent-collection.js, @birthub/agents-core, node:fs/promises, node:path
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 2 time(s) in runtime code.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 40/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: scripts
- Size: 17702 bytes
- SHA-256: 3c7f5573fb5e7a2b592882d70be0e08e7114bee5e5d337f807a411dcc76940d6
- Direct imports/refs: ./github-agent-collection.js, @birthub/agents-core, node:fs/promises, node:path
- Env vars: none
- Related tests: none
