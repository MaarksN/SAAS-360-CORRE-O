# Evidências de hardening — 2026-03-25

Este registro consolida as validações executadas para sair de "deploy por confiança" e manter release orientado a evidência.

## 1) Preflight staging/production (executado)

Comandos executados:

```bash
corepack pnpm release:preflight:staging -- --env-file=ops/env/.env.staging.sealed.example
corepack pnpm release:preflight:production -- --env-file=ops/env/.env.production.sealed.example
```

Resultado:

- `ok: true` em staging.
- `ok: true` em production.
- Escopos `api`, `web` e `worker` sem chaves faltantes.
- Artefatos atualizados em `artifacts/release/*preflight-summary.*`.

## 2) Gates obrigatórios do lane de produção

Validação de configuração em `.github/workflows/cd.yml`:

- `production-preflight` presente e obrigatório.
- `deploy-production` depende de:
  - `production-preflight`
  - `release-smoke-gate`
  - `release-e2e-gate`
  - `rollback-rehearsal-evidence-gate`
- Upload de evidências habilitado por gate.

## 3) Simulação de indisponibilidade de dependência obrigatória

Comandos executados:

```bash
corepack pnpm --filter @birthub/config build
corepack pnpm --filter @birthub/web test -- tests/health.required-dependency.test.ts
corepack pnpm --filter @birthub/worker test -- test/readiness.required-dependency.test.ts
```

Resultado:

- Web: teste passou validando `503` e status `degraded` quando API obrigatória está indisponível.
- Worker: teste passou validando status `degraded` quando Redis obrigatório está indisponível.

## 4) Inventário legado no caminho crítico

Varredura com `git grep` (fora de `docs/**`) confirma:

- Sem consumidores runtime críticos de `@birthub/db` fora da camada de compatibilidade/policies.
- Sem runtime ativo de `apps/api-gateway` e `apps/agent-orchestrator` no `HEAD` atual.
- `apps/dashboard` permanece classificado como legacy/quarentena.

## 5) Governança e fronteiras

Ajustes de alinhamento aplicados:

- `docs/slo.md` reescrito para core canônico (`api`, `web`, `worker`, `database`).
- `docs/operations/f0-sla-severity-policy.md` removendo critérios de severidade ancorados em `api-gateway`.
- `docs/taxonomy.md` alinhado ao catálogo canônico (`packages/agent-packs` como satélite).
- `scripts/bootstrap-dev-test.sh` atualizado para fluxo core (sem `api-gateway`).
- `scripts/testing/run-shard.mjs` removendo shards/pacotes legados do caminho padrão.

## 6) Higiene de repositório (peso morto explícito)

Arquivos temporários versionados removidos da raiz:

- `agents_lint.txt`
- `lint_audit.txt`
- `lint_audit_after.txt`
- `logger_lint.txt`
- `web_lint.txt`
- `worker_lint.txt`
- `workflows_lint.txt`

## 7) Arquivamento de `.github/agents` fora da árvore operacional

Mudança estrutural aplicada:

- `git mv .github/agents docs/archive/github-agents`

Controles ajustados:

- Workflow de conformidade de agentes atualizado para `docs/archive/github-agents`.
- Instruções (`applyTo`) e playbook atualizados para o novo local arquivado.
- Catálogo canônico de famílias de agentes publicado em `docs/agent-packs/canonical-agent-line.md`.

## 8) Verificações de freeze pós-cutover

Comandos executados:

```bash
corepack pnpm ci:legacy-runtime-surface-freeze
corepack pnpm ci:legacy-db-surface-freeze
```

Resultado:

- Legacy runtime surface freeze: **passed**.
- Legacy DB surface freeze: **passed**.

## 9) Inventário de consumidores legados de dados

Comando executado:

```bash
corepack pnpm audit:f2:db-imports
```

Resultado:

- Auditoria concluída com artefatos em `artifacts/f2-legacy-2026-03-25/logs/`.
- Raw: `01b-git-grep-birthub-db.log`.
- Resumo: `01c-f2-100-git-grep-summary.md`.

## 10) Cutover físico do dashboard para legado controlado

Mudança aplicada:

- `git mv apps/dashboard apps/legacy/dashboard`

Controles alinhados:

- `.github/CODEOWNERS` atualizado para `apps/legacy/dashboard`.
- `scripts/ci/workspace-contract.json` atualizado para o novo root legado.
- `scripts/ci/check-legacy-runtime-surface-freeze.mjs` atualizado para congelar `apps/legacy/dashboard` e permitir somente o rename de migração controlada.
- Documentação canônica atualizada: `README.md`, `docs/service-catalog.md`, `docs/service-criticality.md`, `docs/observability-alerts.md`, `docs/taxonomy.md`, `docs/operations/core-boundaries-communication.md`.

Validação executada:

```bash
corepack pnpm monorepo:doctor
corepack pnpm ci:legacy-runtime-surface-freeze
corepack pnpm ci:legacy-db-surface-freeze
```

Resultado:

- Monorepo Doctor: sem findings críticos e sem warnings.
- Legacy runtime freeze: **passed**.
- Legacy DB freeze: **passed**.
