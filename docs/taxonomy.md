# Taxonomia de Superfícies — BirthHub360

> Fonte de verdade: estado atual do monorepo em `HEAD`, com validação por evidências de runtime (`apps/api`, `apps/worker`, `apps/web`, `packages/database`, `packages/agent-packs`).

## 1) Core canônico

| Superfície | Classe | Owner sugerido | Status | Evidência |
|---|---|---|---|---|
| `apps/web` | Core canônico | Product Frontend | Ativo | `apps/web/package.json` (scripts `dev`, `build`, `start`) |
| `apps/api` | Core canônico | Platform/API | Ativo | `apps/api/src/server.ts` |
| `apps/worker` | Core canônico | Platform/Automation | Ativo | `apps/worker/src/index.ts` |
| `packages/database` | Core canônico | Platform/Data | Ativo | `packages/database/package.json` (`@birthub/database`) |
| `packages/agent-packs` | Core canônico | AI Platform | Ativo | `apps/api/src/modules/marketplace/marketplace-service.ts` e `apps/worker/src/agents/runtime.shared.ts` resolvem catálogo nesse diretório |

## 2) Legado em sunset

| Superfície | Classe | Owner sugerido | Status | Evidência/nota |
|---|---|---|---|---|
| `apps/api-gateway` | Legado em sunset | Platform/API | Ausente no HEAD | Não encontrado em `apps/`; não classificar como P0/ativo |
| `apps/agent-orchestrator` | Legado em sunset | Platform/Automation | Ausente no HEAD | Não encontrado em `apps/`; não classificar como P0/ativo |
| `apps/legacy/dashboard` | Legado em sunset | Product Frontend | Presente | Fora do core canônico atual |
| `packages/db` | Legado em sunset | Platform/Data | Ausente no HEAD | Não encontrado em `packages/`; substituído por `packages/database` |

## 3) Satélites

| Superfície | Classe | Owner sugerido | Status | Observação |
|---|---|---|---|---|
| `apps/voice-engine` | Satélite | Integrations/Voice | Presente | Serviço de apoio, fora do núcleo P0 |
| `apps/webhook-receiver` | Satélite | Integrations | Presente | Borda de ingestão, fora do núcleo P0 |

## 4) Órfãos

| Superfície | Classe | Owner sugerido | Status | Observação |
|---|---|---|---|---|
| `google/genai/__init__.py` | Órfão | Platform/IA (a definir) | Presente | Arquivo isolado sem evidência de integração no runtime canônico |

## Regras de governança

1. Apenas superfícies em **Core canônico** podem ser marcadas como **P0** em documentação de criticidade.
2. Entradas de **Legado em sunset** não podem receber status verde/ativo de produção.
3. Toda mudança de classe (core/legado/satélite/órfão) exige atualização sincronizada de:
   - `docs/service-catalog.md`
   - `docs/service-criticality.md`
   - este arquivo `docs/taxonomy.md`
