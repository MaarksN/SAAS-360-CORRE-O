# Deprecacao e cutover

## Servicos em sunset

- `apps/dashboard`
- `packages/db`
- rotas/auth naming `nextauth` (renomeado para `session`)
- `apps/api-gateway`
- `apps/agent-orchestrator`
- `apps/voice-engine`
- `apps/webhook-receiver`

## Regra de go-live em 2026-03-20

- o lancamento oficial considera apenas `apps/web`, `apps/api`, `apps/worker` e `packages/database`
- `apps/dashboard`, `packages/db`, `apps/api-gateway`, `apps/agent-orchestrator`, `apps/voice-engine` e `apps/webhook-receiver` nao entram no criterio de pronto do go-live
- qualquer dependencia comercial real de uma dessas superficies promove o componente imediatamente para P0 e para o mesmo gate do core

## Politica

- manter por janela de transicao
- bloquear novos usos via CI (doctor)
- remover apos zero consumers

## Classificacao oficial das superficies legadas

| Superficie | Status | Observacao |
| --- | --- | --- |
| `apps/dashboard` | `sunset` | legado operacional fora da lane core, agora conectado ao schema canonico |
| `apps/api-gateway` | `sunset` | proxy/compatibilidade, sem novos contratos |
| `apps/agent-orchestrator` | `sunset` | overlay legado fora do runtime suportado |
| `apps/voice-engine` | `sunset` | compatibilidade operacional |
| `apps/webhook-receiver` | `sunset` | ingestao secundaria ate consolidacao no core |
