# ADR-035: Modularizacao de Hotspots Criticos F3

- Status: Accepted
- Date: 2026-03-22
- Owners: Platform Core
- Reviewers: CODEX local review

## Contexto

Quatro hotspots ativos no monorepo ainda concentravam orquestracao, persistencia e agregacao em arquivos grandes:

- `apps/api/src/modules/agents/service.ts` com 850 linhas
- `apps/api/src/modules/analytics/service.ts` com 500 linhas
- `apps/worker/src/worker.ts` com 826 linhas
- `apps/worker/src/agents/runtime.ts` com 991 linhas

O checklist F3 exige modularizacao orientada a fronteiras claras, limites formais de 400 linhas por arquivo e queda de risco de regressao em pontos P0/P1/P2.

## Decisao

Adotamos extracao por responsabilidade operacional:

- `analytics`: coleta, relatorios e dashboards foram separados em modulos independentes.
- `agents/service`: parsing de config, snapshot, repositorio, policy e enqueue passaram a viver em arquivos dedicados.
- `worker`: validacao de jobs, persistencia, billing lock, fan-out de notificacoes e processamento de fila foram isolados.
- `runtime`: budget, memory, resolution, tools e artifacts foram extraidos para modulos coesos.

Os contratos publicos foram preservados:

- `apps/api/src/modules/analytics/service.ts` continua exportando a API anterior.
- `apps/api/src/modules/agents/service.ts` continua expondo `InstalledAgentsService`.
- `apps/worker/src/worker.ts` continua expondo `createBirthHubWorker` e `validateLegacyTaskJob`.
- `apps/worker/src/agents/runtime.ts` continua expondo `executeManifestAgentRuntime`.

## Limites Formais F3

- Hotspots F3 devem ficar em no maximo 400 linhas por arquivo principal.
- Extracoes devem isolar IO, regras de negocio e adaptadores externos em arquivos distintos.
- Cobertura minima local deve incluir testes de caracterizacao dos helpers extraidos.
- Validacoes remotas de CI e producao devem ser tratadas como evidencias externas, nao como pre-condicao local de merge.

## Consequencias

- Positivas
  - Arquivos principais agora ficam abaixo do limite de 400 linhas.
  - O custo de manutencao caiu porque cada hotspot passou a ter fronteiras nomeadas.
  - Os helpers extraidos ganharam testes unitarios diretos.
- Negativas
  - O numero de arquivos aumentou.
  - A complexidade ciclomática formal ainda depende de automacao dedicada para metricas numericas por funcao.
- Risco residual
  - Validacao de throughput real em producao continua fora do escopo local.
  - Branch por hotspot e CI remoto continuam dependendo do fluxo externo do repositorio.
- Rollback
  - Possivel por revert dos arquivos extraidos sem mudanca de contrato publico.

## Evidencias

- Relatorio: `docs/evidence/f3-hotspots-2026-03-22.md`
- Testes locais: `node --import tsx --test ...`
- Lint local: `.\node_modules\.bin\eslint.cmd ...`
