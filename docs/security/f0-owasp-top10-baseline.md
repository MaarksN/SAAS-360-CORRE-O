# F0 OWASP Top 10 Baseline

- generatedAt: 2026-03-23T02:42:09.084Z
- semgrep findings: 5
- inline credential findings: 1
- dependency audit (high/critical): 0/0

## Classification

| OWASP | Category | Status | Evidence |
| --- | --- | --- | --- |
| A01 | Broken Access Control | monitoring | security:guards executed (auth guard coverage) |
| A02 | Cryptographic Failures | finding | 2 semgrep finding(s) on crypto usage |
| A03 | Injection | monitoring | Semgrep TypeScript/Express rules executed |
| A04 | Insecure Design | monitoring | Threat model and security guardrails documented |
| A05 | Security Misconfiguration | ok | pnpm audit high=0 critical=0 |
| A06 | Vulnerable and Outdated Components | ok | dependency audit snapshot archived |
| A07 | Identification and Authentication Failures | monitoring | RBAC/auth guard checks in local security gate |
| A08 | Software and Data Integrity Failures | monitoring | CI governance + lockfile integrity in baseline logs |
| A09 | Security Logging and Monitoring Failures | monitoring | monitoring rules and dashboard tracked in infra/monitoring |
| A10 | Server-Side Request Forgery | monitoring | policy and guardrails documented; requires DAST lane |

## Evidence

- artifacts/security/semgrep-f0-initial.json
- artifacts/security/pnpm-audit-high.json
- artifacts/security/inline-credential-scan.json
- docs/security/security-coverage-report.md
