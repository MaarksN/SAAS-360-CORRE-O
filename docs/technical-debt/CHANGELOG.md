# Technical Debt Changelog

All notable technical debt changes are documented here by sprint.

## [2026-S12]

### Added
- Created the F10 documentation hub in `docs/f10/README.md`.
- Added deploy, rollback, DR and escalation runbooks.
- Added central templates for ADR, RFC, post-mortem and release checklist.
- Added automated docs governance scripts for link checking, dependency graph and technical health dashboard.

### Fixed
- Corrected root documentation entrypoints in `README.md`.
- Replaced thin onboarding and operations notes with operationally useful guides.
- Expanded the canonical OpenAPI registry in `apps/api` and added an automated coverage proof for runtime route parity.
- Added a mandatory database proof gate to CI/release validation for RLS and performance coverage.
- Completed the BR payments, fiscal and signature integration status flows with shared HTTP retry/error handling and contract tests.
- Unblocked the Agent Studio E2E critical flow with fixture-backed installed agents and a valid SSE mock.

### Evidence
- `README.md`
- `docs/f10/architecture.md`
- `docs/runbooks/deploy-canonical-stack.md`
- `scripts/docs/check-doc-links.mjs`
- `.github/workflows/ci.yml`
- `apps/api/src/docs/openapi.catalog.ts`
- `apps/api/tests/openapi.coverage.test.ts`
- `scripts/ci/db-proof-gate.mjs`
- `packages/integrations/src/clients/http.test.ts`
- `tests/e2e/agent-studio.spec.ts`

## [2026-S11]

### Added
- Initial canonical lane scorecard and release gate documentation.
- Added observability baseline artifacts and release scorecard automation.

## [2026-S10]

### Added
- Initial release documentation for canonical go-live.
- Early migration and cutover policy drafts.
