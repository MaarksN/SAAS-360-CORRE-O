# ADR-012: Modularização F3 de bootstrap HTTP e seed de banco

- **Status:** Aprovado
- **Data:** 2026-03-22
- **Contexto:** O checklist F3 estabelece limite de 400 linhas por arquivo e pede decomposição explícita de `api/app.ts` e `database/seed.ts`. Antes desta mudança, `apps/api/src/app.ts` tinha 643 linhas e `packages/database/prisma/seed.ts` tinha 892 linhas, concentrando middleware, autenticação, bootstrap de rotas e toda a orquestração de seed em um único ponto.

## Decisão

1. Dividir o bootstrap HTTP em módulos orientados a responsabilidade:
   - `apps/api/src/app/core.ts` para infraestrutura, middlewares globais, docs e health checks.
   - `apps/api/src/app/auth-routes.ts` para login, MFA, refresh, logout e sessões.
   - `apps/api/src/app/core-business-routes.ts` para organização, `/me` e enfileiramento de tarefas.
   - `apps/api/src/app/module-routes.ts` para montagem dos routers de domínio.
2. Dividir o seed do Prisma em módulos por domínio:
   - `packages/database/prisma/seed/data.ts` para fixtures e workflows base.
   - `packages/database/prisma/seed/helpers.ts` para limpeza do banco e seed de planos.
   - `packages/database/prisma/seed/workflows.ts` para persistência do grafo de workflows.
   - `packages/database/prisma/seed/tenant.ts` para tenants, memberships, billing, quota e artefatos associados.
3. Manter `app.ts` e `seed.ts` como pontos de entrada mínimos, apenas coordenando dependências.

## Consequências

- Os pontos de entrada ficam abaixo do limite F3 de 400 linhas.
- O risco de regressão diminui porque middleware, autenticação e seed por domínio agora possuem fronteiras explícitas.
- O checklist F3 ainda mantém hotspots pendentes em `apps/worker/src/agents/runtime.ts`, `apps/worker/src/worker.ts`, `apps/api/src/modules/agents/service.ts`, `packages/agents/executivos/narrativeweaver/agent.ts` e `apps/api/src/modules/analytics/service.ts`, que seguem como candidatos de próximas extrações.
