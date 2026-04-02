# scripts/ops/generate-vps-env.mjs

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: node:crypto, node:fs, node:path
- Env vars: none
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 2 time(s) in runtime code.
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 60/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: JavaScript
- Top level: scripts
- Size: 4308 bytes
- SHA-256: 0aa600de610a953fca1b8265cf36de382f6edf78fef5b251606c78bd6c40115c
- Direct imports/refs: node:crypto, node:fs, node:path
- Env vars: none
- Related tests: none
