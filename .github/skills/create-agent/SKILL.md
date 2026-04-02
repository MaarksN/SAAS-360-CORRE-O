---
name: create-agent
description: 'Create robust custom agents with clear contract, minimal tools, and validation checklist. Use when designing or scaling agent catalogs.'
argument-hint: 'Describe domain, responsibilities, and constraints for the new agent'
user-invocable: true
---

# Create Agent Skill

## Quando Usar
- Criar novo agente com responsabilidade única.
- Padronizar catálogo de agentes por domínio.
- Revisar ou refatorar agentes com sobreposição de escopo.

## Procedimento
1. Definir contrato do agente (objetivo, entrada, saída, fora de escopo).
2. Selecionar ferramentas mínimas (`tools`) e justificar.
3. Escrever `description` com gatilhos claros de descoberta.
4. Criar arquivo `.agent.md` via template.
5. Validar com checklist F1-F5.

## Recursos
- [Template de agente](./references/template-agent.md)
- [Checklist de validação](./references/checklist-validacao.md)
- [Template de contrato](./assets/contract-template.md)
