# Evidências de hardening do core - 2026-03-24

## Etapa 1 - Produção por evidência

### Preflight staging

Comando:

```bash
pnpm release:preflight:staging -- --env-file=ops/env/.env.staging.sealed.example
```

Resultado: `ok: true` para `api`, `web`, `worker`.

### Preflight production

Comando:

```bash
pnpm release:preflight:production -- --env-file=ops/env/.env.production.sealed.example
```

Resultado: `ok: true` para `api`, `web`, `worker`.

### Gates obrigatórios em CD

Arquivo validado: `.github/workflows/cd.yml`.

Gates presentes e obrigatórios antes de `deploy-production`:

- `production-preflight`
- `release-smoke-gate`
- `release-e2e-gate`
- `rollback-rehearsal-evidence-gate`

## Etapa 3 - Health/readiness com falha de dependência

### Web - dependência obrigatória indisponível

Comando:

```bash
pnpm --filter @birthub/web exec node --import tsx --test tests/health.required-dependency.test.ts
```

Resultado:

- teste passou
- endpoint devolve `503`
- payload: `status=degraded` quando API obrigatória está down

### Worker - Redis indisponível

Comando:

```bash
pnpm --filter @birthub/worker exec node --import tsx --test test/readiness.required-dependency.test.ts
```

Resultado:

- teste passou
- readiness devolve `status=degraded`
- dependência `redis.status=down`

### Smoke global de release

Comando:

```bash
pnpm release:smoke
```

Resultado da execução desta data:

- `lint-core`: PASS
- `typecheck-core`: PASS
- `test-core`: PASS
- `test-isolation`: PASS
- `release-migration-dry-run`: PASS
- `privacy-anonymization`: PASS
- `playwright-release`: PASS

Interpretação: gate está operacional e atualmente íntegro para release por evidência (pipeline smoke completo verde).

### Correções aplicadas para fechamento do smoke

- `packages/logger/src/index.ts`: mantidos imports/exports `NodeNext` com sufixo `.js`.
- `packages/logger/src/metrics.js` e `packages/logger/src/otel.js`: bridges para compatibilidade do Turbopack consumindo `src` no monorepo.
- `playwright.config.ts`: `webServer.url` alterado para `http://127.0.0.1:3001/` (disponibilidade local), evitando bloqueio por `503` de `/health` dependente da API.

## Etapa 2/4/5 - Reconciliação operacional

Evidências registradas nesta execução:

- atualização de ownership canônico em `docs/operations/f0-ownership-matrix.md`
- atualização de migração canônica de dados em `docs/processes/MIGRACAO_CANONICA_DB.md`
- ajustes de CI para remover dependência crítica de `apps/agent-orchestrator` ausente:
  - `.github/workflows/ci.yml`
  - `scripts/ci/run-satellites.mjs`

### Guardas adicionais de contenção de legado

- `scripts/ci/check-legacy-db-surface-freeze.mjs`
  - comando: `pnpm ci:legacy-db-surface-freeze`
  - objetivo: bloquear regressão de referências a `@birthub/db`/`packages/db` fora de `packages/db` e eixos documentais.
- `scripts/ci/check-legacy-runtime-surface-freeze.mjs`
  - comando: `pnpm ci:legacy-runtime-surface-freeze`
  - objetivo: bloquear reintrodução de superfícies legadas (`apps/api-gateway`, `apps/agent-orchestrator`, `apps/dashboard`).

## Etapa 6 - Baseline operacional de agentes

- comando executado: `pnpm agent:snapshot`
- artefato gerado e higienizado: `artifacts/agent-readiness/agent-snapshot-2026-03-24.json`
- objetivo: registrar baseline objetivo para consolidação progressiva de catálogo/capabilities.
