# F3 — P0 Auth Split (etapa sessão) — 2026-03-21

## Objetivo da etapa

Extrair responsabilidades de sessão de `auth.service.ts` para módulo dedicado, reduzindo acoplamento e risco de regressão no hotspot de autenticação.

## Mudanças aplicadas

- Novo módulo: `apps/api/src/modules/auth/auth.service.sessions.ts`.
- Funções movidas para o módulo de sessão:
  - `createSession`
  - `createNewDeviceAlert`
  - `refreshSession`
  - `revokeCurrentSession`
  - `revokeAllSessions`
  - `listActiveSessions`
  - `revokeSessionById`
- `apps/api/src/modules/auth/auth.service.ts` atualizado para:
  - importar e reutilizar as funções de sessão extraídas;
  - reexportar funções públicas para manter contrato externo estável.

## Validação de regressão

- Typecheck API: **PASS**
  - Evidência: `artifacts/f3-auth-split-2026-03-21/logs/01-api-typecheck.log`
- Testes API: **PASS**
  - Evidência: `artifacts/f3-auth-split-2026-03-21/logs/02-api-test.log`

## Impacto esperado

- Redução de complexidade local em `auth.service.ts`.
- Fronteira mais clara para próximas extrações da F3 (credenciais, MFA e políticas).

## Risco residual

- **Médio**: o hotspot principal ainda contém domínios múltiplos (credenciais/MFA/políticas) não extraídos nesta etapa.

## Rollback

- Reversível por restauração de `auth.service.ts` e remoção de `auth.service.sessions.ts`.

## Template de fechamento (Anexo B)

- [x] ITEM-ID: F3-P0-AUTH-SPLIT-SESSION
  - Owner: Platform API
  - Severidade: P0
  - Prazo: 2026-03-21
  - Evidência: `apps/api/src/modules/auth/auth.service.sessions.ts`, `artifacts/f3-auth-split-2026-03-21/logs/*`
  - Risco residual: médio
  - Rollback: sim
