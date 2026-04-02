# Playbook de Escala - 332 Agentes (BirthHub360)

## Objetivo
- Escalar criacao de agentes com consistencia, seguranca e qualidade.

## Pilha de Customizacao
1. Workspace Instructions (`.github/copilot-instructions.md`)
2. File Instructions (`.github/instructions/*.instructions.md`)
3. Custom Agents (`.github/agents/*.agent.md`)
4. Skills (`.github/skills/**/SKILL.md`)
5. Prompts (`.github/prompts/*.prompt.md`)
6. Hooks (`.github/hooks/policy.json` + scripts)

## Mapeamento F1-F5
- F1 Descoberta: `description` com gatilhos reais.
- F2 Contrato: objetivo, entrada/saida, limites, riscos.
- F3 Prompting: instrucoes claras + formato de saida.
- F4 Implementacao: arquivo correto + tools minimas.
- F5 Validacao cruzada: revisao por `Reviewer Agent` + hooks.

## Rollout Recomendado
1. Lote por ciclo (15 ciclos).
2. Trinca operacional: Planner -> Implementer -> Reviewer.
3. Gate de promocao:
- `feito` apenas com F1-F5 completos.
- ciclos criticos exigem revisao humana final.
4. Metricas operacionais:
- taxa de aprovacao na primeira revisao
- tempo medio por agente
- retrabalho por tipo de erro
- falhas de descoberta

## Definicao de Pronto (DoD)
- Frontmatter valido.
- Responsabilidade unica e clara.
- Ferramentas minimas e justificadas.
- Contrato completo.
- Checklist F1-F5 aprovado.
- Revisao humana (quando aplicavel) concluida.
