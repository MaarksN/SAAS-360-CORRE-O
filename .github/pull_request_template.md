## Resumo

Descreva objetivamente o que mudou, qual risco foi tratado e qual evidência de validação acompanha o PR.

## Justificativa formal

Preencha esta seção somente se o PR ultrapassar 500 linhas alteradas ou concentrar mudanças estruturalmente acopladas. Explique o motivo do lote, o plano de revisão e o rollback.

## Linked issue(s)

- Closes #

## What was updated

- [ ] Documentation
- [ ] Backend (API / services)
- [ ] Frontend (dashboard / UI)
- [ ] Infra / CI
- [ ] Tests

## Checklist de Qualidade de Pull Request

- [ ] ADR ou documentação de arquitetura associada atualizada (se aplicável).
- [ ] Testes unitários/E2E escritos e passando.
- [ ] Limites de complexidade e tamanho de arquivo respeitados.
- [ ] Dependências validadas e pacotes monorepo usando `workspace:*`.
- [ ] Sem exports ou imports mortos.
- [ ] Naming conventions respeitadas (kebab-case no front, snake_case no backend).
- [ ] Segurança aprovada e sem credenciais inline expostas.
- [ ] Se `pnpm-lock.yaml` mudou, houve aprovacao dupla (security + platform) e label `security-approved`.
- [ ] Workspaces alterados mantem `lint`, `typecheck`, `test` e `build`, ou `N/A` aprovado no relatorio F4.

## Hygiene checklist

- [ ] Branch name follows policy (`feat/`, `fix/`, `refactor/`, `chore/`, `release/`, `hotfix/`)
- [ ] Commit messages follow Conventional Commits or are explicitly allowlisted
- [ ] Naming rules remain intact (`snake_case` in `agents/`, `*.service.ts` / `*.controller.ts` / `*.repository.ts` / `*.types.ts`)
- [ ] Documentation source of truth reviewed or updated
- [ ] Internal package changelog updated when package manifests changed
- [ ] Dependency approval register updated when external dependencies changed
- [ ] No runtime artifacts, dumps or local `.env` files were versioned
- [ ] Rollback impact documented

## What was updated

- [ ] Documentation
- [ ] Backend (API / services)
- [ ] Frontend (dashboard / UI)
- [ ] Infra / CI
- [ ] Tests

## Validation

```bash
pnpm artifacts:clean
pnpm branch:check
pnpm commits:check
pnpm hygiene:check
pnpm docs:check-links
pnpm monorepo:doctor
```

## Breaking changes

- [ ] No breaking changes
- [ ] Yes (describe below)

## Deployment notes

<!-- Include migrations, env vars, rollout notes, and rollback plan if needed. -->
