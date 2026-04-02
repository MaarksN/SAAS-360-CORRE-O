# Production Release Runbook

## Objetivo

Executar release do core canônico com trilha de auditoria mínima e rollback verificável.

## Pré-condições

- Branch de origem: `main`
- `production-preflight`, `release-smoke-gate`, `release-e2e-gate` e `rollback-rehearsal-evidence-gate` habilitados no workflow `CD`
- Evidências locais esperadas:
  - `artifacts/release/production-preflight-summary.json`
  - `artifacts/release/smoke-summary.json`
  - `artifacts/release/production-rollback-evidence.json`

## Execução

1. Validar que o commit desejado passou no workflow `CI`.
2. Validar `pnpm release:scorecard` e `pnpm monorepo:doctor`.
3. Executar `pnpm release:preflight:production`.
4. Executar `pnpm release:smoke`.
5. Executar `pnpm test:e2e:release`.
6. Registrar o identificador do rehearsal de rollback.
7. Disparar `workflow_dispatch` do `CD` com `deploy_target=production`.

## Critérios de bloqueio

- Qualquer `ok: false` em `artifacts/release/*-summary.json`
- Ausência de evidência de rollback
- Divergência entre escopo do release e o core canônico

## Pós-release

1. Arquivar artefatos em `artifacts/release/`.
2. Atualizar `CHANGELOG.md`.
3. Atualizar `releases/manifests/release_artifact_catalog.md`.
4. Registrar pendências residuais em `audit/final_governance_report.md`.
