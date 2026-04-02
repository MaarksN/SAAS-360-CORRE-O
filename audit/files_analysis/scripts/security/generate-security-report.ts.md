# scripts/security/generate-security-report.ts

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: node:fs, node:path
- Env vars: NPM_AUDIT_STATUS, RBAC_STATUS, SEMGREP_STATUS, ZAP_STATUS
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 1 time(s) in runtime code.
- direct_env_access: Reads environment variables directly outside the shared config surface.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 45/100

## Status
- MELHORAR

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: scripts
- Size: 1143 bytes
- SHA-256: 3ea0af806c8375c9038ebb824813fb56a6443a9eb92eba8296ec42a8f3b3acd7
- Direct imports/refs: node:fs, node:path
- Env vars: NPM_AUDIT_STATUS, RBAC_STATUS, SEMGREP_STATUS, ZAP_STATUS
- Related tests: none
