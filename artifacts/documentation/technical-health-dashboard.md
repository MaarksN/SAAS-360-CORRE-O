# Technical Health Dashboard

Sprint atual: `2026-S12`

## Summary

- Itens monitorados: 7
- Itens fechados: 5
- Itens abertos: 2
- Risco residual alto: 0

## Status

| Status | Quantidade |
| --- | --- |
| `closed` | 5 |
| `in-progress` | 1 |
| `open` | 1 |

## Residual risk by domain

| Dominio | Itens |
| --- | --- |
| `api` | 1 |
| `architecture` | 1 |
| `documentation` | 1 |
| `enablement` | 1 |
| `governance` | 1 |
| `operations` | 1 |
| `tooling` | 1 |

## Tracker snapshot

| ID | Titulo | Dominio | Status | Prioridade | Owner | Risco residual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `TD-001` | Root documentation entrypoints drifted from the real repo structure | `documentation` | `closed` | `P1` | Platform Enablement | `low` | `README.md`<br>`docs/f10/README.md` |
| `TD-002` | Operational runbooks were fragmented and missing rollback and disaster recovery playbooks | `operations` | `closed` | `P1` | Platform Engineering | `low` | `docs/runbooks/deploy-canonical-stack.md`<br>`docs/runbooks/rollback-canonical-stack.md`<br>`docs/runbooks/disaster-recovery.md` |
| `TD-003` | Documentation governance lacked automated link validation and reproducible dependency graph generation | `tooling` | `closed` | `P1` | Developer Experience | `low` | `scripts/docs/check-doc-links.mjs`<br>`scripts/docs/generate-dependency-graph.mjs`<br>`.github/workflows/ci.yml` |
| `TD-004` | Technical debt reporting had no single tracker, dashboard, or executive summary | `governance` | `closed` | `P1` | Engineering Management | `low` | `docs/technical-debt/README.md`<br>`docs/technical-debt/dashboard.md`<br>`artifacts/documentation/technical-health-dashboard.md` |
| `TD-005` | OpenAPI coverage is still partial for the full apps/api surface | `api` | `closed` | `P1` | API Core | `low` | `apps/api/src/docs/openapi.catalog.ts`<br>`apps/api/src/docs/openapi.ts`<br>`apps/api/tests/openapi.coverage.test.ts` |
| `TD-006` | Legacy compatibility surfaces remain operational and increase documentation drift risk | `architecture` | `open` | `P2` | Architecture Council | `medium` | `docs/processes/DEPRECACAO_E_CUTOVER.md`<br>`docs/f10/architecture.md` |
| `TD-007` | Knowledge transfer recordings and owner sign-off still depend on scheduled human sessions | `enablement` | `in-progress` | `P2` | Engineering Managers | `medium` | `docs/f10/knowledge-transfer.md`<br>`docs/f10/continuity-validation.md` |
