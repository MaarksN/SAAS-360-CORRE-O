# Prompt Mestre para Jules: Auditoria Completa de 3292 Artefatos

## Contexto

Voce deve executar uma auditoria forense completa, robusta e sem omissoes sobre os artefatos de governanca, auditoria, rastreabilidade, ciclos/fases, readiness, arquitetura e derivados analiticos existentes neste repositorio.

Esta auditoria deve ser executada com base no corpus consolidado gerado em `2026-03-29T20:06:19.662531`.

## Arquivos obrigatorios de entrada

1. Corpus HTML completo com o conteudo integral dos artefatos:
   `C:\Users\Marks\Documents\GitHub\PROJETO-FINAL-BIRTHUB-360-INNOVATION\audit\governance_inventory_complete_2026-03-29.html`
2. Checklist mestre em HTML:
   `C:\Users\Marks\Documents\GitHub\PROJETO-FINAL-BIRTHUB-360-INNOVATION\audit\governance_audit_master_checklist_2026-03-29.html`
3. Checklist mestre em Markdown:
   `C:\Users\Marks\Documents\GitHub\PROJETO-FINAL-BIRTHUB-360-INNOVATION\audit\governance_audit_master_checklist_2026-03-29.md`
4. Inventario JSON estruturado:
   `C:\Users\Marks\Documents\GitHub\PROJETO-FINAL-BIRTHUB-360-INNOVATION\audit\governance_inventory_complete_2026-03-29.json`

## Pacote externo obrigatorio de confronto

Os arquivos abaixo tambem fazem parte da auditoria e devem ser lidos e confrontados com o estado real do repositorio e com o corpus principal de 3292 artefatos:

1. `C:\Users\Marks\Desktop\Nova pasta\auditoria_forense_codex.html` - HTML de auditoria forense do Codex
2. `C:\Users\Marks\Desktop\Nova pasta\JULES_PRE_VALIDACAO.md` - pre-validacao do Jules
3. `C:\Users\Marks\Desktop\Nova pasta\UNDECLARED_OBSERVATIONS.md` - observacoes nao declaradas e hipoteses
4. `C:\Users\Marks\Desktop\Nova pasta\CHECKLIST_ITEM_A_ITEM_STATUS_2026-03-20.md` - status item a item consolidado
5. `C:\Users\Marks\Desktop\Nova pasta\JULES_EXECUTION_REPORT_F0.md` - relatorio de execucao do Jules para F0
6. `C:\Users\Marks\Desktop\Nova pasta\JULES_PARECER_FINAL.md` - parecer final do Jules
7. `C:\Users\Marks\Desktop\Nova pasta\auditoria_forense_repositorio.html` - HTML de auditoria forense do repositorio
8. `C:\Users\Marks\Desktop\Nova pasta\checklist_governanca_unificada_2026-03-22.html` - checklist unificado de governanca
9. `C:\Users\Marks\Desktop\Nova pasta\baseline-execution-report-2026-03-22.md` - baseline execution report
10. `C:\Users\Marks\Desktop\Nova pasta\f0-baseline-report-2026-03-22.md` - baseline report da fase F0
11. `C:\Users\Marks\Desktop\Nova pasta\f0-freeze-signoff-2026-03-22.md` - sign-off final de freeze F0
12. `C:\Users\Marks\Desktop\Nova pasta\PROMPT_GERAL_PENDENCIAS.md` - prompt geral de pendencias forenses
13. `C:\Users\Marks\Desktop\Nova pasta\COMMERCIALIZATION_REQUIREMENTS.md` - requisitos de comercializacao
14. `C:\Users\Marks\Desktop\Nova pasta\organization-audit-2026-03-22.md` - auditoria de organizacao do repositorio
15. `C:\Users\Marks\Desktop\Nova pasta\audit_forensic_report.md` - relatorio forense consolidado historico

## Volume auditavel

- Total de artefatos: 3292
- Derivados em `audit/files_analysis`: 1802
- Itens marcados como duplicados: 1432
- Itens inconsistentes: 384
- Grupos de duplicidade exata: 2
- Grupos de conflito de versao: 5
- Espelhos orfaos: 374
- Referencias `sourcePath` ausentes: 668

## Distribuicao por categoria

- Agent Lifecycle (ciclos / fases / F1–F5): 31
- Architecture & Maturity: 64
- Control & Verification (checklists, checks.json): 74
- Derived / Analytical Mirror (files_analysis): 1802
- Gap & Remediation: 39
- Governance & Audit Artifacts: 528
- Instructional Artifacts (prompts): 12
- Readiness & Release Assurance: 391
- Traceability & Inventory: 351

## Alertas criticos ja conhecidos

- Ha 374 espelhos em `audit/files_analysis` cujo artefato primario nao existe mais na arvore viva.
- Ha 668 artefatos compilados com `sourcePath` apontando para arquivos ausentes na arvore viva; a rastreabilidade depende apenas do espelho `files_analysis`.
- Foram encontrados 2 grupos de duplicidade exata entre artefatos primarios, exigindo consolidacao de fonte de verdade.
- Foram encontrados 5 grupos de versoes conflitantes por nome normalizado e conteudo divergente.
- O inventario ja existente em `audit/forensic_inventory.md` e resumido; ele nao substitui a listagem arquivo a arquivo desta varredura.
- O inventario de segredos de release existe em `releases/manifests/` e em `ops/`, indicando duplicidade potencial de manutencao.

## Objetivo

Validar a integridade, consistencia, cobertura e utilidade operacional dos 3292 artefatos. O foco nao e o codigo funcional da plataforma. O foco e o sistema de controle, execucao, readiness e auditoria da engenharia.

## Regras obrigatorias

1. Zero omissao. Nenhum item do checklist pode ficar sem verificacao.
2. Zero invencao. Se nao houver evidencia direta no corpus ou no arquivo real, registrar como `NAO COMPROVADO`.
3. Tratar o checklist HTML e o inventario JSON como lista canonica de escopo.
4. Tratar o corpus HTML como fonte principal de leitura rapida. Se houver ambiguidade, validar no arquivo real do repositorio.
5. Respeitar a organizacao por fases, ciclos e grupos transversais.
6. Diferenciar claramente: artefato primario, artefato derivado, duplicado, inconsistente e espelho orfao.
7. Todo achado deve conter evidencia objetiva: caminho, trecho, metadado ou contradicao verificavel.
8. Se um artefato for apenas documental e nao tiver lastro operacional, registrar isso explicitamente.
9. Confrontar obrigatoriamente o pacote externo de evidencias com o inventario principal e registrar qualquer divergencia de escopo, contagem, status, aprovacao, freeze, baseline ou claim de implementacao.
10. Se um documento externo afirmar que algo esta `APROVADO`, `CONCLUIDO` ou `PRONTO`, validar no repositorio e registrar como inconsistencia critica caso nao exista lastro tecnico correspondente.

## Metodo de execucao

1. Abrir o checklist HTML e usar os grupos por fase/ciclo como ordem de varredura.
2. Para cada artefato, verificar no minimo:
   - existencia real
   - coerencia do nome e do caminho
   - categoria e tipo tecnico
   - aderencia ao objetivo de governanca/auditoria
   - evidencia util ou evidencia fraca
   - duplicidade ou conflito de versao
   - relacao com readiness, traceabilidade, arquitetura ou lifecycle
   - se e acionavel, apenas documental ou espelho derivado
3. Para o pacote externo de confronto, verificar tambem:
   - se os totais e escopos declarados batem com o universo atual de 3292 artefatos
   - se os status `aprovado`, `concluido`, `pronto` ou equivalentes possuem evidencia empirica no repositorio
   - se existem pendencias, observacoes nao declaradas ou gaps citados fora da trilha oficial
   - se baseline, freeze, sign-off e organization audit convergem com os artefatos vivos do repositorio
   - se os documentos HTML externos descrevem o mesmo sistema de governanca ou uma fotografia historica divergente
   - se `COMMERCIALIZATION_REQUIREMENTS.md` depende de gaps ainda abertos ou de controles inexistentes
4. Ao final de cada grupo, consolidar: achados criticos, lacunas, contradicoes, artefatos redundantes e artefatos obsoletos.
5. Ao final da auditoria completa, gerar uma avaliacao executiva do sistema de governanca da engenharia.

## Saidas obrigatorias

Gerar os seguintes arquivos:

1. `C:\Users\Marks\Documents\GitHub\PROJETO-FINAL-BIRTHUB-360-INNOVATION\audit\jules_full_audit_report_2026-03-29.md`
2. `C:\Users\Marks\Documents\GitHub\PROJETO-FINAL-BIRTHUB-360-INNOVATION\audit\jules_findings_2026-03-29.json`
3. `C:\Users\Marks\Documents\GitHub\PROJETO-FINAL-BIRTHUB-360-INNOVATION\audit\jules_remediation_backlog_2026-03-29.md`

## Estrutura minima do relatorio principal

### 1. Resumo executivo
- estado geral da governanca
- principais riscos
- nivel de confianca da auditoria

### 2. Cobertura real da auditoria
- total auditado
- total com evidencia forte
- total com evidencia fraca
- total inconsistente
- total derivado sem primario vivo

### 3. Achados por severidade
- critico
- alto
- medio
- baixo

### 4. Achados por fase/ciclo
- F0 ate F11
- ciclos detectados
- grupos transversais

### 5. Achados estruturais
- duplicidade
- conflitos de versao
- espelhos orfaos
- sourcePath quebrado
- fragmentacao documental
- ausencia de implementacao operacional
- contradicoes entre pacote externo e repositorio vivo

### 6. Mapa de maturidade da governanca
- controles fortes
- controles incompletos
- controles simulados
- controles ausentes

### 7. Backlog de remediacao priorizado
- item
- severidade
- impacto
- acao recomendada
- artefatos afetados

## Formato de cada finding

Para cada finding, use este formato:

- `id`: identificador unico
- `severity`: critico | alto | medio | baixo
- `title`: titulo objetivo
- `artifacts`: lista de caminhos afetados
- `evidence`: trecho objetivo ou contradicao verificavel
- `impact`: risco gerado
- `recommendation`: acao de remediacao
- `phase_cycle_scope`: fase, ciclo ou grupo transversal
- `confidence`: alta | media | baixa

## Criterios de julgamento

- `APROVADO`: artefato consistente, util e aderente ao controle esperado
- `APROVADO COM RESSALVAS`: existe, mas com lacunas, ambiguidade ou baixa operacionalidade
- `REPROVADO`: inconsistente, redundante, quebrado, sem lastro ou enganoso
- `NAO COMPROVADO`: evidencia insuficiente para concluir

## Restricoes

- Nao reduzir a auditoria a um resumo superficial.
- Nao pular grupos menores.
- Nao assumir que arquivos em `files_analysis` substituem o primario.
- Nao tratar duplicidade como aceitavel sem justificativa.
- Nao encerrar a execucao sem cobrir os 3292 itens do checklist.

## Resultado esperado

Uma auditoria utilizavel para tomada de decisao executiva e saneamento do repositorio, com rastreabilidade clara entre achado, evidencia e remediacao.
