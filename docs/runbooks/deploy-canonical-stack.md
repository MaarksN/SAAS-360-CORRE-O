# Deploy Canonical Stack

## Escopo

Este runbook cobre somente `apps/web`, `apps/api`, `apps/worker` e `packages/database`.

## Passos

1. Confirmar `main` como branch fonte.
2. Validar `pnpm install --frozen-lockfile`.
3. Validar `pnpm release:preflight:staging`.
4. Validar `pnpm release:preflight:production`.
5. Validar `pnpm release:smoke`.
6. Validar `pnpm test:e2e:release`.
7. Executar o workflow `CD` em `workflow_dispatch`.
8. Confirmar `deploy-production` concluído.

## Evidências mínimas

- `artifacts/release/staging-preflight-summary.json`
- `artifacts/release/production-preflight-summary.json`
- `artifacts/release/smoke-summary.json`
- `artifacts/release/production-rollback-evidence.json`
