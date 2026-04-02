# F3 — P0 Auth Split (etapa credenciais + MFA) — 2026-03-21

## Objetivo da etapa

Extrair o fluxo de autenticação por credenciais e verificação MFA de `auth.service.ts` para módulo dedicado, preservando contrato externo e comportamento.

## Mudanças aplicadas

- Novo módulo: `apps/api/src/modules/auth/auth.service.credentials.ts`.
- Funções movidas:
  - `loginWithPassword`
  - `verifyMfaChallenge`
  - `setupMfaForUser`
  - `enableMfaForUser`
- `apps/api/src/modules/auth/auth.service.ts` atualizado para:
  - importar e reexportar funções do novo módulo;
  - manter a API pública estável para rotas e consumidores existentes.

## Validação de regressão

- Typecheck API: **PASS**
  - Evidência: `artifacts/f3-auth-split-2026-03-21/logs/03-api-typecheck-credentials.log`
- Testes API: **PASS**
  - Evidência: `artifacts/f3-auth-split-2026-03-21/logs/04-api-test-credentials.log`

## Evolução do hotspot (métrica)

- `auth.service.ts`: **1116 → 529 linhas**
- Evidência: `artifacts/f3-auth-split-2026-03-21/auth-linecount.txt`

## Impacto esperado

- Redução de complexidade do hotspot de auth.
- Fronteiras mais claras entre sessão, credenciais/MFA e políticas/chaves.

## Risco residual

- **Médio**: ainda restam responsabilidades de políticas/RBAC e gestão de chaves no arquivo principal.

## Rollback

- Reversível por restauração de `auth.service.ts` e remoção de `auth.service.credentials.ts`.

## Template de fechamento (Anexo B)

- [x] ITEM-ID: F3-P0-AUTH-SPLIT-CREDENTIALS-MFA
  - Owner: Platform API
  - Severidade: P0
  - Prazo: 2026-03-21
  - Evidência: `apps/api/src/modules/auth/auth.service.credentials.ts`, `artifacts/f3-auth-split-2026-03-21/logs/*`
  - Risco residual: médio
  - Rollback: sim
