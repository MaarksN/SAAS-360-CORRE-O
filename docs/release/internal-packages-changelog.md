# Internal Packages Changelog

Use este arquivo quando qualquer `apps/*/package.json`, `packages/*/package.json` ou `agents/*/package.json` for alterado.

## 2026-03-31

### Database CI bootstrap lane

- adicionado `db:bootstrap:ci` em `@birthub/database` e no workspace root para materializar bancos efemeros de CI com `migrate deploy` seguido de `db push`
- alinhados os jobs `platform`, `workflow-suite` e `security-guardrails` para usar bootstrap de schema compatível com testes, sem acoplar os runners ao checklist pós-migração de release

### Next.js package export alignment

- adicionados subpaths `./nextjs` em `@birthub/config`, `@birthub/logger` e `@birthub/workflows-core` para estabilizar a resolucao do web app no Turbopack/Next durante CI e E2E
- alinhado o bootstrap do pipeline para reinstalar o lockfile e manter os exports internos consistentes entre build local e GitHub Actions

## 2026-03-22

### Repository hygiene baseline (F9)

- adicionados guardrails de branch, commit, naming, links e artifacts no CI
- documentadas políticas de naming, source of truth de documentação e aprovação de dependências
- consolidado o relatório de saúde estrutural do monorepo em `artifacts/doctor/`

### Runtime overlay script compliance (F4)

- adicionados `lint`, `typecheck`, `test` e `build` visíveis com `N/A` formal para `ae-agent-worker`, `analista-agent-worker`, `financeiro-agent-worker`, `juridico-agent-worker`, `ldr-agent-worker`, `marketing-agent-worker`, `pos_venda-agent-worker` e `sdr-agent-worker`
- alinhada `scripts/ci/script-compliance-policy.json` com o estado real de `@birthub/shared` e `@birthub/shared-types`
