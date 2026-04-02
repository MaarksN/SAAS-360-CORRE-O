# Catálogo de Serviços e Repositórios (Taxonomia Canônica)

> Legenda de status: 🟢 **core canônico (P0)** · 🟡 **satélite operacional** · 🔴 **legacy/quarentena**

## Fonte única operacional

Este documento é a **fonte única** para fronteiras operacionais entre core, legado e satélites.

- Apenas `apps/web`, `apps/api`, `apps/worker` e `packages/database` são **core canônico**.
- Superfícies em **legacy/quarentena** não são default de desenvolvimento nem de operação.
- Satélites são suportados, porém com governança e severidade abaixo do core.

## Índice único de fronteiras operacionais

| Camada | Superfície | Tipo | Estado operacional | Dono sugerido | Evidência de runtime |
|---|---|---|---|---|---|
| Core | `apps/web` | Front-end | 🟢 Default para experiência do produto | Product Frontend | `apps/web/package.json` |
| Core | `apps/api` | API | 🟢 Default para tráfego de negócio | Platform/API | `apps/api/src/server.ts` |
| Core | `apps/worker` | Worker | 🟢 Default para filas e processamento assíncrono | Platform/Automation | `apps/worker/src/index.ts` |
| Core | `packages/database` | Data layer | 🟢 Default para schema, client Prisma e migrações | Platform/Data | `packages/database/package.json` |
| Legacy/Quarentena | `apps/legacy/dashboard` | Front-end legado | 🔴 Fora de P0 e sem papel de rota principal | Product Frontend | Diretório legado mantido para compatibilidade interna |
| Legacy/Quarentena | `apps/api-gateway` | API legado | 🔴 Não presente no `HEAD` atual | Platform/API | Sem evidência de runtime atual |
| Legacy/Quarentena | `apps/agent-orchestrator` | Worker legado | 🔴 Não presente no `HEAD` atual | Platform/Automation | Sem evidência de runtime atual |
| Legacy/Quarentena | `packages/db` | Data package legado | 🔴 Não presente no `HEAD` atual | Platform/Data | Substituído por `packages/database` |
| Satélite | `packages/agent-packs` | Catálogo de agentes | 🟡 Dependência de domínio, não infraestrutura core | AI Platform | `apps/api/src/modules/marketplace/marketplace-service.ts`; `apps/worker/src/agents/runtime.shared.ts` |
| Satélite | `apps/webhook-receiver` | Ingestão de eventos | 🟡 Borda de integração | Platform/Integrations | Serviço dedicado de entrada externa |
| Satélite | `apps/voice-engine` | Serviço de voz | 🟡 Capacidade adicional | Platform/Automation | Serviço fora do núcleo transacional |

## Diretriz canônica

1. **Core canônico oficial:** `apps/web`, `apps/api`, `apps/worker`, `packages/database`.
2. **Legacy/quarentena:** não define roadmap principal, não recebe classificação P0 e não deve aparecer como default em onboarding, runbook ou operação.
3. **Satélites:** continuam suportados, mas com SLO/alerta e governança proporcionais ao impacto indireto no fluxo principal.
4. **Qualquer divergência** entre documentos deve ser resolvida em favor deste catálogo.
