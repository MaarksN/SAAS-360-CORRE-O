# Diretrizes de Engenharia de Agentes

## Objetivo
- Entregar agentes estáveis, auditáveis e orientados a contrato.

## Convenções Obrigatórias
- Cada agente deve ter responsabilidade única.
- Cada mudança em customizações deve passar por checklist F1-F5.
- Ferramentas devem seguir o princípio do menor privilégio.
- Descrições devem conter gatilhos reais de descoberta com padrão "Use when...".

## Qualidade
- Toda criação de agente/skill/prompt deve incluir contrato, critérios de aceite, riscos e rollback.
- Operações destrutivas exigem confirmação explícita.
- Evite instruções genéricas: priorize regras acionáveis e verificáveis.

## Contrato Obrigatorio por Agente
- Objetivo (1 frase clara).
- Entrada esperada (formato e limites).
- Saida obrigatoria (estrutura verificavel).
- Fora de escopo (o que nao faz).
- Ferramentas permitidas.
- Criterios de aceite.
- Riscos e mitigacao.
- Rollback.

## Escopo
- Este arquivo é global para o workspace.
- Regras específicas por stack ou domínio devem ir em `.github/instructions/*.instructions.md`.
