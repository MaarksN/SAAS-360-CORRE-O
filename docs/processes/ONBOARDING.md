# Onboarding do Desenvolvedor

Este guia foi reescrito para que um engenheiro consiga chegar ao primeiro PR em menos de 1 hora usando apenas documentacao do repositorio.

## Resultado esperado em 60 minutos

| Janela | Objetivo | Evidencia |
| --- | --- | --- |
| 0-10 min | Preparar maquina e credenciais | `pnpm --version`, Docker/Redis/Postgres disponiveis |
| 10-25 min | Instalar dependencias e gerar client do banco | `pnpm install`, `pnpm db:generate` |
| 25-40 min | Validar workspace e levantar stack local | `pnpm monorepo:doctor`, `pnpm dev` |
| 40-50 min | Executar smoke checks | `pnpm docs:verify`, `pnpm release:scorecard` |
| 50-60 min | Abrir primeiro PR pequeno | branch, alteracao simples, PR template preenchido |

## Pre-requisitos

- Node.js 22+
- pnpm 9.1+
- Docker Desktop com WSL2 no Windows, ou Docker Engine no Linux/macOS
- Acesso a `.env`, Sentry e provedores usados pelo seu dominio
- Permissao de leitura no repositorio e no ambiente de staging

## Setup inicial

1. Clone o repositorio e entre na raiz.
2. Copie as variaveis de ambiente: `cp .env.example .env`.
3. Rode `pnpm install`.
4. Gere o client do banco com `pnpm db:generate`.
5. Valide a workspace com `pnpm monorepo:doctor`.
6. Suba a stack com `pnpm dev`.

Se o Docker Desktop falhar ao subir `postgres` ou `redis`, habilite WSL2 e a feature `Virtual Machine Platform` antes de repetir o bootstrap local.

## Ordem de leitura recomendada

1. `README.md`
2. `docs/f10/README.md`
3. `docs/f10/architecture.md`
4. `docs/OPERATIONS.md`
5. `docs/runbooks/new-engineer-onboarding.md`

## Primeiro PR esperado

- Alteracao pequena em documentacao, template ou teste.
- Validacoes minimas executadas: `pnpm docs:verify` e `pnpm monorepo:doctor`.
- PR preenchido com risco, plano de rollback e evidencias.

## Quando pedir ajuda

- Bloqueio de acesso a segredos, Sentry ou deploy hook: acione Platform Engineering.
- Duvida sobre fronteira canonica x legado: consulte `docs/DEPRECACAO_E_CUTOVER.md`.
- Falha de ambiente local: abra issue pelo template `documentation-gap` ou `bug-report`.
