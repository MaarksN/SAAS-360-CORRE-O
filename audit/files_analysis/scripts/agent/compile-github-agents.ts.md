# scripts/agent/compile-github-agents.ts

## Purpose
- Executable source under scripts. Declares exports such as compileGithubAgentsCollection.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: ./github-agent-collection.js, @birthub/agents-core, node:fs/promises, node:path
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 1 time(s) in runtime code.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 35/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: scripts
- Size: 24490 bytes
- SHA-256: f1a54efe762586cf85318681a6045be91be2b37c5794c2a5d6be750ed6b6e198
- Direct imports/refs: ./github-agent-collection.js, @birthub/agents-core, node:fs/promises, node:path
- Env vars: none
- Related tests: none
