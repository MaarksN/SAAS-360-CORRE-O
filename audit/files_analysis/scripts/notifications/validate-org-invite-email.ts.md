# scripts/notifications/validate-org-invite-email.ts

## Purpose
- Executable source under scripts. No explicit named exports detected.

## Architectural Role
- Repository root or cross-cutting support file.

## Dependencies
- Imports/refs: none
- Env vars: NEXT_PUBLIC_APP_URL, WEB_BASE_URL
- Related tests: none

## Operational Relevance
- Included in the SaaS score.

## Problems
- console_logging: Uses console-based logging 2 time(s) in runtime code.
- network_without_timeout: External network operations do not show an explicit timeout or abort path.
- direct_env_access: Reads environment variables directly outside the shared config surface.
- no_related_test: No directly related automated test file was found by filename heuristic.

## Risk Score
- 70/100

## Status
- CRITICO

## Evidence
- Kind: runtime
- Language: TypeScript
- Top level: scripts
- Size: 823 bytes
- SHA-256: 3c7fb980689ba7e7dda874f72ede3c417a01e1e92707e7fc5e6ae58a110b705d
- Direct imports/refs: none
- Env vars: NEXT_PUBLIC_APP_URL, WEB_BASE_URL
- Related tests: none
