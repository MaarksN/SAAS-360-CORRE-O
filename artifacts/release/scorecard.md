# Release Scorecard
Generated at: 2026-03-30T17:45:07.822Z
Minimum score threshold: 100
Score: 100

Canonical go-live scope: `apps/web`, `apps/api`, `apps/worker`, `packages/database`.
Legacy and satellite surfaces stay outside the 2026-03-20 launch gate unless promoted explicitly.

| Gate | Status | Detail |
| --- | --- | --- |
| Workspace audit | PASS | Workspace contract matches the canonical core lane |
| Monorepo doctor | PASS | No critical findings in the canonical go-live scope |
| Security baseline report | PASS | Report present |
| Schema migration lock | PASS | Prisma lock present |
| SLO baseline | PASS | SLO documentation present |
| Score threshold | PASS | Score 100 meets minimum 100 |