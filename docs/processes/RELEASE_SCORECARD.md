# Release Scorecard

Comando: `pnpm release:scorecard`

## Escopo atual do scorecard

- gate canonico de go-live: `apps/web`, `apps/api`, `apps/worker`, `packages/database`
- superficies legadas ou satelites ficam fora do corte de `2026-03-20`, salvo promocao explicita

## Gates atuais

- workspace audit
- monorepo doctor
- baseline de seguranca
- lock de migrations Prisma
- baseline de SLO documentada

## Observacao

O scorecard nao substitui o gate completo de lancamento. Antes do go-live tambem devem ficar verdes:

- `pnpm install --frozen-lockfile`
- `pnpm lint:core`
- `pnpm typecheck:core`
- `pnpm test:core`
- `pnpm test:isolation`
- `pnpm build:core`
- `pnpm test:e2e:release`
- `pnpm release:preflight:staging`
- `pnpm release:preflight:production`

Saida: `artifacts/release/scorecard.md`.
