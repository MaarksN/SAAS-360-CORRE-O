# Processo seguro para atualizacao de dependencias

Este fluxo e obrigatorio para qualquer PR que altere manifests (`package.json`, `pnpm-workspace.yaml`) ou `pnpm-lock.yaml`.

## Controles obrigatorios no CI

- `pnpm install --frozen-lockfile` em todos os workflows que instalam dependencias.
- Validacao automatica de todos os workflows para impedir `pnpm install` sem `--frozen-lockfile`.
- Verificacao de hash do lockfile via `.github/lockfile/pnpm-lock.sha256`.
- Falha automatica quando a regeneracao de lockfile (`pnpm install --lockfile-only --ignore-scripts`) produz diff.
- Alerta bloqueante para PR com alteracao em `pnpm-lock.yaml` sem label `security-approved` (PRs para `main` e `develop`).
- Simulacao de lockfile corrompido para provar que o gate falha corretamente.

## Passo a passo de atualizacao segura

1. Crie branch de trabalho e sincronize com `main` ou `develop`.
2. Aplique mudanca de dependencia de forma explicita (versao, motivo e risco).
3. Rode `pnpm install --frozen-lockfile` para validar baseline antes da mudanca.
4. Gere o lockfile atualizado com o fluxo padrao de update de dependencia.
5. Rode `pnpm lockfile:hash:update` para atualizar o hash canonico.
6. Rode `pnpm ci:lockfile` para validar frozen lockfile, hash, cache e governanca de PR.
7. Atualize `docs/processes/dependency-approval-register.md` com contexto, licenca e rollback.
8. Abra PR com evidencias tecnicas e aplique a label `security-approved` apos revisao de security.

## Regra de aprovacao dupla

- Aprovacao 1: owner de security (`@platform-security`) para risco e superficie de ataque.
- Aprovacao 2: owner de platform/dominio impactado (`@platform-devex` ou owner do pacote alterado).
- Merge permitido somente com todos os checks obrigatorios verdes e code owners aprovando.

## Evidencias minimas no PR

- Comandos executados localmente (`pnpm ci:lockfile`, testes relevantes).
- Diff do lockfile explicado (pacotes alterados e razao).
- Registro de aprovacao no dependency register.
- Plano de rollback para a dependencia alterada.
