# Matriz de Criticidade por Serviço (Canônica)

Fonte canônica de fronteiras: `docs/service-catalog.md`.

## Níveis
- **P0 (Crítico):** indisponibilidade interrompe o fluxo principal da plataforma.
- **P1 (Alto):** degradação relevante em componente satélite com impacto operacional indireto.
- **P2 (Médio):** impacto moderado em capacidade não essencial no fluxo principal.
- **P3 (Baixo):** superfície em legado/quarentena sem papel no core canônico.

## Core canônico (único P0)

| Serviço | Criticidade | Justificativa | RTO | RPO |
|---|---|---|---|---|
| `apps/api` | P0 | API principal do produto e porta de entrada do runtime canônico. | 30 min | 5 min |
| `apps/web` | P0 | Interface principal para usuários e operação diária. | 30 min | 15 min |
| `apps/worker` | P0 | Processamento assíncrono crítico (jobs e automações de negócio). | 30 min | 10 min |
| `packages/database` (PostgreSQL/Prisma) | P0 | Persistência transacional oficial (`@birthub/database`). | 30 min | 5 min |
| `packages/agent-packs` | P0 | Catálogo de agentes diretamente integrado ao runtime canônico. | 30 min | 5 min |

## Satélites (fora do core)

| Serviço | Criticidade | Justificativa | RTO | RPO |
|---|---|---|---|---|
| `apps/webhook-receiver` | P1 | Entrada de integrações externas; impacto indireto no fluxo principal. | 1 h | 15 min |
| `apps/voice-engine` | P2 | Capacidade complementar sem bloqueio do núcleo transacional. | 4 h | 1 h |

## Legacy/quarentena

| Serviço | Criticidade | Justificativa | RTO | RPO |
|---|---|---|---|---|
| `apps/legacy/dashboard` | P3 | Superfície legada/suporte, fora do runtime principal. | 1 dia útil | 4 h |
| `apps/api-gateway` | P3 | Componente legado não presente no `HEAD` atual. | N/A | N/A |
| `apps/agent-orchestrator` | P3 | Componente legado não presente no `HEAD` atual. | N/A | N/A |
| `packages/db` | P3 | Pacote legado substituído por `packages/database`. | N/A | N/A |

## Diretriz de atendimento
- Apenas superfícies do **core canônico** podem receber classificação **P0**.
- Incidentes **P0 (core)**: acionamento imediato de on-call + atualização a cada 30 minutos.
- Incidentes **P1/P2 (satélites)**: triagem por prioridade operacional e comunicação horária.
- Incidentes **P3 (legacy/quarentena)**: sem plantão dedicado; priorização por janela de manutenção.
