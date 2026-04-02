# Go-Live Runbook - 2026-03-20

## Escopo oficial

O lancamento de `2026-03-20` considera apenas o **core canonico**:

- `apps/web`
- `apps/api`
- `apps/worker`
- `packages/database`

Ficam fora do criterio de pronto, salvo promocao explicita:

- `apps/dashboard`
- `packages/db`
- `apps/api-gateway`
- `apps/agent-orchestrator`
- `apps/voice-engine`
- `apps/webhook-receiver`

## Gatilhos de bloqueio

- qualquer falha em `pnpm install --frozen-lockfile`
- qualquer falha em `pnpm monorepo:doctor`
- qualquer falha em `pnpm release:scorecard`
- qualquer falha em `pnpm lint:core`, `pnpm typecheck:core`, `pnpm test:core`, `pnpm test:isolation` ou `pnpm build:core`
- qualquer falha em `pnpm test:e2e:release`
- qualquer falha em `pnpm release:preflight:staging` ou `pnpm release:preflight:production`
- qualquer dependencia operacional do core em `apps/dashboard` ou `packages/db`

## Status atual em 2026-03-17

### Verde no workspace atual

- `pnpm install --frozen-lockfile`
- `pnpm monorepo:doctor`
- `pnpm release:scorecard`
- `pnpm lint:core`
- `pnpm typecheck:core`
- `pnpm test:core`
- `pnpm test:isolation`
- `pnpm build:core`
- `pnpm release:smoke`
- `pnpm test:e2e:release`

### Ainda bloqueado no workspace atual

- `pnpm release:preflight:staging`
- `pnpm release:preflight:production`

Motivo atual (historico): nao existiam equivalentes de `.env.staging` e `.env.production` com segredos validos no workspace. Esse bloqueio passa a ser coberto por equivalentes selados em `ops/env/.env.staging.sealed.example` e `ops/env/.env.production.sealed.example` + gates obrigatorios no CD.

Referencia de inventario e ownership: `docs/release/production-preflight-inventory.md`.

## Sequencia obrigatoria

### 2026-03-17 - desbloqueio do lane

1. Sincronizar `pnpm-lock.yaml` com os manifests atuais sem upgrade oportunista.
2. Validar `pnpm install --frozen-lockfile`.
3. Rodar `pnpm monorepo:doctor`.
4. Rodar `pnpm release:scorecard`.
5. Rodar `pnpm lint:core`, `pnpm typecheck:core`, `pnpm test:core`, `pnpm test:isolation` e `pnpm build:core`.
6. Classificar cada falha em apenas um grupo:
   - bloqueador de lancamento
   - correcao obrigatoria pre-launch
   - backlog pos-launch

### 2026-03-18 - hardening guiado por falhas

1. Corrigir apenas o que falhou no lane do dia `2026-03-17`.
2. Revalidar login, sessao, billing, webhooks Stripe, workflows e fila/worker.
3. Confirmar observabilidade minima:
   - health
   - logs estruturados
   - metricas
   - audit trail
4. Confirmar que o legado nao esta no caminho critico.

### 2026-03-19 - rehearsal de producao

1. Rodar `pnpm release:preflight:staging -- --env-file=ops/env/.env.staging.sealed.example`.
2. Rodar `pnpm release:preflight:production -- --env-file=ops/env/.env.production.sealed.example`.
3. Rodar `pnpm release:smoke`.
4. Rodar `pnpm test:e2e:release`.
5. Validar migrations, rollback, segredos e variaveis obrigatorias.

### 2026-03-20 - go-live

1. Freeze total de codigo.
2. Executar apenas passos do runbook aprovado.
3. Abrir war room com monitoramento continuo de:
   - autenticacao e sessao
   - billing
   - filas
   - worker
   - API error rate
4. Preservar o core antes de considerar qualquer incidente em modulo fora do escopo.

## Criterios de aceite

### Tecnicos

- install congelado verde
- doctor e scorecard verdes
- lint, typecheck, test, test:isolation e build do core verdes
- E2E mestre verde
- preflight de staging e producao verdes
- smoke de release verde

### Operacionais

- rollback testado
- observabilidade acessivel
- secrets conferidos
- legado fora do caminho critico

## Riscos aceitos para pos-launch

- hotspots grandes permanecem sem refactor estrutural antes do go-live
- suite Python de integracao segue lenta, mas verde
- o legado continua em quarentena enquanto houver consumidores remanescentes
