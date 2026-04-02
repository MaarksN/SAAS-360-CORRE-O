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

### Evidence
- `README.md`
- `docs/f10/architecture.md`
- `docs/runbooks/deploy-canonical-stack.md`
- `scripts/docs/check-doc-links.mjs`
- `.github/workflows/ci.yml`

## [2026-S11]

### Added
- Initial canonical lane scorecard and release gate documentation.
- Added observability baseline artifacts and release scorecard automation.

## [2026-S10]

### Added
- Initial release documentation for canonical go-live.
- Early migration and cutover policy drafts.
