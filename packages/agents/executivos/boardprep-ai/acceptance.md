# acceptance.md — BoardPrep AI
<!-- [SOURCE] BirthHub360 Checklist Universal + Protocolo de Governança Cruzada -->

agent_name: BoardPrep AI
cycle: 1
domain: executivos
phase_owner: Jules
validator: Codex
status: draft

## Objetivo
Validar que o agente `BoardPrep AI` transforma contexto executivo disperso em um briefing de board claro, consistente, rastreável e acionável, sem inventar fatos, números ou decisões.

## Escopo funcional
O agente deve:
- consolidar insumos executivos relevantes;
- organizar material para reunião de conselho;
- destacar riscos, decisões pendentes, métricas-chave e recomendações;
- explicitar lacunas de informação;
- sinalizar quando um dado não estiver confirmado.

## Critérios de aceite

| ID | Critério | Input mínimo | Output esperado | Como verificar | Evidência |
|---|---|---|---|---|---|
| BA-ACC-001 | Estrutura obrigatória do output | contexto da reunião + KPIs + riscos + decisões pendentes | resposta contém `resumo_executivo`, `kpis_chave`, `riscos`, `decisoes_requeridas`, `recomendacoes`, `lacunas_de_informacao` | executar teste unitário e snapshot estrutural | `tests/test_unit.*` |
| BA-ACC-002 | Não inventar números ou fatos | input sem valor de KPI ou sem dado financeiro completo | output marca dado como ausente/incerto e não preenche número fictício | teste com payload incompleto | `tests/test_unit.*` |
| BA-ACC-003 | Tom executivo e não agressivo | input padrão | linguagem objetiva, profissional e adequada a board | revisão do prompt + teste textual | `system_prompt.md`, `tests/test_unit.*` |
| BA-ACC-004 | Priorização de riscos | lista com riscos de severidades diferentes | riscos ordenados por criticidade/impacto, com justificativa sucinta | teste com massa controlada | `tests/test_unit.*` |
| BA-ACC-005 | Decisões requeridas claramente separadas de observações | contexto com itens informativos e itens decisórios | seção de decisões não mistura comentário geral com deliberação necessária | teste semântico do output | `tests/test_unit.*` |
| BA-ACC-006 | Fallback canônico em falha de ferramenta | simular indisponibilidade de ferramenta | retry 3x com backoff; se 429, aguarda e tenta 1x; se falhar, escala para humano | teste de integração/mock | `agent.ts|py`, `tools.ts|py`, `tests/test_unit.*` |
| BA-ACC-007 | Observabilidade mínima emitida | execução normal | logs incluem início, fim, falha, fallback e trace/correlation id | inspeção de logs + teste | `agent.ts|py`, `tests/test_unit.*` |
| BA-ACC-008 | Schema estrito | payload com campo extra não declarado | rejeição do input ou erro explícito de validação | `test_schema.*` | `schemas.ts|py`, `tests/test_schema.*` |
| BA-ACC-009 | Respeito à BKB/contexto fornecido | input com fatos confirmados na base | output reutiliza apenas fatos suportados pelo contexto | teste com base controlada | `system_prompt.md`, `tests/test_unit.*` |
| BA-ACC-010 | Saída orientada a ação | contexto com problemas e oportunidades | recomendações específicas, priorizadas e ligadas ao contexto | revisão semântica + teste snapshot | `tests/test_unit.*` |

## Casos obrigatórios de teste
1. Cenário completo com KPIs, riscos e decisões.
2. Cenário com dados faltantes.
3. Cenário com conflito entre narrativa e KPI.
4. Cenário com ferramenta indisponível.
5. Cenário com campo extra no input.
6. Cenário com risco crítico que exige destaque prioritário.

## Regras de reprovação automática
- qualquer placeholder residual;
- qualquer número inventado;
- ausência de seção obrigatória;
- ausência de fallback canônico;
- ausência de logs mínimos;
- schema aceitando campos extras;
- output sem indicação de lacunas quando faltarem dados.

## Condição de pronto
Este arquivo só é considerado apto quando:
- todos os critérios acima forem testáveis;
- não houver linguagem vaga;
- cada critério apontar para evidência concreta;
- Codex conseguir derivar testes diretamente deste documento.
