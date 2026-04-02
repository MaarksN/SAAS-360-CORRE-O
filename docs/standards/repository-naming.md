# Repository Naming Standard

## Objective

Eliminar ambiguidade estrutural e impedir a reintrodução de aliases conflitantes no monorepo.

## Directories

- `apps/` e `packages/` usam `kebab-case` para diretórios de workspace.
- `agents/` usa `snake_case` para diretórios internos Python/worker.
- `docs/` usa diretórios em minúsculas; novos agrupamentos devem preferir `kebab-case`.
- Novos ADRs devem ser criados em `docs/adrs/`.

## Public identifiers

- IDs de agentes, filas, slugs de produto, manifests e nomes visíveis externamente usam `kebab-case`.
- Exemplo: diretório interno `agents/pos_venda/` expõe o identificador público `pos-venda`.

## TypeScript file names

Use os seguintes padrões para novas camadas:

- `*.service.ts`
- `*.controller.ts`
- `*.repository.ts`
- `*.types.ts`

Evite novos arquivos no formato `lead-service.ts`, `lead-controller.ts`, `lead-repository.ts` e `lead-types.ts`.

## Legacy aliases under quarantine

Os caminhos abaixo continuam existindo apenas por compatibilidade e não devem receber novos arquivos:

- `agents/pos-venda/main.py`
- `docs/adr/*`

## Enforcement

As regras são validadas por `pnpm hygiene:check` e por `pnpm workspace:audit` no CI.
