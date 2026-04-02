# apps/web/next.config.mjs

## Purpose
- Configuration or manifest file controlling runtime/build behavior. No explicit named exports detected.

## Architectural Role
- Web application component.

## Dependencies
- Imports/refs: node:path, node:url
- Env vars: CSP_REPORT_URI, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_CSP_REPORT_ONLY, NEXT_PUBLIC_POSTHOG_HOST
- Related tests: none

## Operational Relevance
- Included in the SaaS score because it directly shapes runtime behavior or quality gates.

## Problems
- No heuristic issues were triggered by the static scan.

## Risk Score
- 10/100

## Status
- OK

## Evidence
- Kind: config
- Language: JavaScript
- Top level: apps
- Size: 2315 bytes
- SHA-256: 0ced33023373aebb63aa1d1f2e5f3c131638a76fd677235f959bada4086f96a7
- Direct imports/refs: node:path, node:url
- Env vars: CSP_REPORT_URI, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_CSP_REPORT_ONLY, NEXT_PUBLIC_POSTHOG_HOST
- Related tests: none
