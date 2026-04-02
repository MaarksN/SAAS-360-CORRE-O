# Master Governance Checklist

## Score Summary

- Documentação Operacional: 91/100
- Evidências de Auditoria: 90/100
- Artefatos de Release: 83/100
- Score geral ponderado: 88/100

## Documentação Operacional

### [DOC-01] README operacional canônico
Descrição clara: Ponto único de entrada para operação do core canônico.
Critério de validação objetiva: `docs/operational/README.md` versionado.
Evidência: `docs/operational/README.md`
Status: ✅ IMPLEMENTADO

### [DOC-02] Manual operacional consolidado
Descrição clara: Manual central com comandos mínimos e guardrails.
Critério de validação objetiva: `docs/operational/manuals/operations_guide.md` presente.
Evidência: `docs/operational/manuals/operations_guide.md`
Status: ✅ IMPLEMENTADO

### [DOC-03] README raiz delimita o core canônico
Descrição clara: README principal informa escopo canônico e superfícies legadas.
Critério de validação objetiva: README contém core canônico e zonas de legado/quarentena.
Evidência: `README.md`
Status: ✅ IMPLEMENTADO

### [DOC-04] Índice geral de documentação
Descrição clara: Existe um índice versionado para documentação do repositório.
Critério de validação objetiva: `docs/README.md` presente.
Evidência: `docs/README.md`
Status: ✅ IMPLEMENTADO

### [DOC-05] Índice geral aponta para o hub operacional
Descrição clara: O índice principal referencia a nova estrutura operacional.
Critério de validação objetiva: `docs/README.md` contém `operational/README.md`.
Evidência: `docs/README.md`, `docs/operational/README.md`
Status: ✅ IMPLEMENTADO

### [DOC-06] Catálogo de serviços
Descrição clara: Fonte de verdade para fronteiras e superfícies do monorepo.
Critério de validação objetiva: `docs/service-catalog.md` presente.
Evidência: `docs/service-catalog.md`
Status: ✅ IMPLEMENTADO

### [DOC-07] Matriz de criticidade por serviço
Descrição clara: Cada serviço relevante possui criticidade operacional registrada.
Critério de validação objetiva: `docs/service-criticality.md` presente.
Evidência: `docs/service-criticality.md`
Status: ✅ IMPLEMENTADO

### [DOC-08] Matriz de ownership
Descrição clara: Ownership por domínio e segredos críticos está documentado.
Critério de validação objetiva: `docs/operations/f0-ownership-matrix.md` presente.
Evidência: `docs/operations/f0-ownership-matrix.md`
Status: ✅ IMPLEMENTADO

### [DOC-09] Política de SLA por severidade
Descrição clara: SLA operacional possui política publicada.
Critério de validação objetiva: `docs/operations/f0-sla-severity-policy.md` presente.
Evidência: `docs/operations/f0-sla-severity-policy.md`
Status: ✅ IMPLEMENTADO

### [DOC-10] Baseline de aderência SLA 90d
Descrição clara: A política de SLA aponta para uma baseline histórica verificável.
Critério de validação objetiva: `docs/operations/f0-sla-adherence-baseline-90d.md` presente.
Evidência: sem evidência local
Status: ❌ NÃO IMPLEMENTADO
Severidade: 🔴 CRÍTICO
Impacto: Não existe prova histórica de aderência ao SLA publicado.
Risco: Due diligence pode classificar a operação como sem lastro empírico.
Consequência prática: SLA permanece apenas declaratório.

### [DOC-11] Inventário de variáveis de ambiente
Descrição clara: Configuração operacional obrigatória está documentada.
Critério de validação objetiva: `docs/environment-variables-inventory.md` presente.
Evidência: `docs/environment-variables-inventory.md`
Status: ✅ IMPLEMENTADO

### [DOC-12] Observabilidade e alertas documentados
Descrição clara: Alertas e SLOs possuem documentação versionada.
Critério de validação objetiva: `docs/observability-alerts.md` e `docs/OBSERVABILIDADE_E_SLOS.md` presentes.
Evidência: `docs/observability-alerts.md`, `docs/OBSERVABILIDADE_E_SLOS.md`
Status: ✅ IMPLEMENTADO

### [DOC-13] Runbook de deploy do stack canônico
Descrição clara: Há procedimento de deploy para o core canônico.
Critério de validação objetiva: `docs/runbooks/deploy-canonical-stack.md` presente.
Evidência: `docs/runbooks/deploy-canonical-stack.md`
Status: ✅ IMPLEMENTADO

### [DOC-14] Runbook de rollback do stack canônico
Descrição clara: Há procedimento versionado de rollback operacional.
Critério de validação objetiva: `docs/runbooks/rollback-canonical-stack.md` presente.
Evidência: `docs/runbooks/rollback-canonical-stack.md`
Status: ✅ IMPLEMENTADO

### [DOC-15] Runbook de disaster recovery
Descrição clara: Existe procedimento versionado para recuperação de desastre.
Critério de validação objetiva: `docs/runbooks/disaster-recovery.md` presente.
Evidência: `docs/runbooks/disaster-recovery.md`
Status: ✅ IMPLEMENTADO

### [DOC-16] Matriz de resposta a incidentes
Descrição clara: Severidades e owners de resposta estão mapeados.
Critério de validação objetiva: `docs/runbooks/incident-response-matrix.md` presente.
Evidência: `docs/runbooks/incident-response-matrix.md`
Status: ✅ IMPLEMENTADO

### [DOC-17] Matriz de resposta a alertas P1
Descrição clara: Alertas P1 possuem procedimento padronizado.
Critério de validação objetiva: `docs/runbooks/p1-alert-response-matrix.md` presente.
Evidência: `docs/runbooks/p1-alert-response-matrix.md`
Status: ✅ IMPLEMENTADO

### [DOC-18] Processo de release versionado
Descrição clara: Há documento que materializa o fluxo de release a partir do CD.
Critério de validação objetiva: `docs/release/release-process.md` presente.
Evidência: `docs/release/release-process.md`, `.github/workflows/cd.yml`
Status: ✅ IMPLEMENTADO

### [DOC-19] Fonte de verdade documental
Descrição clara: O repositório define formalmente a política de fonte de verdade.
Critério de validação objetiva: `docs/processes/documentation-source-of-truth.md` presente.
Evidência: `docs/processes/documentation-source-of-truth.md`
Status: ✅ IMPLEMENTADO

### [DOC-20] Índice de ADRs
Descrição clara: ADRs possuem índice navegável.
Critério de validação objetiva: `docs/adrs/INDEX.md` presente.
Evidência: `docs/adrs/INDEX.md`
Status: ✅ IMPLEMENTADO

### [DOC-21] Onboarding aponta para a estrutura operacional atual
Descrição clara: Documentos de onboarding não devem apontar para caminhos obsoletos.
Critério de validação objetiva: `docs/processes/ONBOARDING.md` referencia o hub atual e não `docs/OPERATIONS.md`.
Evidência: `docs/processes/ONBOARDING.md`
Status: ⚠ PARCIAL
Severidade: 🟡 MÉDIO
Impacto: Onboarding ainda carrega caminho operacional obsoleto.
Risco: Novos operadores consultam referências não canônicas.
Consequência prática: Adoção da nova estrutura fica incompleta.

### [DOC-22] Snapshots legados não referenciam evidência inexistente
Descrição clara: Documentos legados/snapshot devem apontar apenas para artefatos existentes.
Critério de validação objetiva: `docs/F0/sla.md` não referencia arquivos ausentes.
Evidência: `docs/F0/sla.md`
Status: ⚠ PARCIAL
Severidade: 🟡 MÉDIO
Impacto: Snapshot legado aponta para baseline inexistente.
Risco: Leitores podem interpretar aderência de SLA como comprovada.
Consequência prática: Documentação histórica induz falsa sensação de maturidade.

## Evidências de Auditoria

### [AUD-01] README de auditoria
Descrição clara: A área de auditoria possui ponto canônico de entrada.
Critério de validação objetiva: `audit/README.md` presente.
Evidência: `audit/README.md`
Status: ✅ IMPLEMENTADO

### [AUD-02] Inventário forense
Descrição clara: Existe inventário versionado do material auditado.
Critério de validação objetiva: `audit/forensic_inventory.md` presente.
Evidência: `audit/forensic_inventory.md`
Status: ✅ IMPLEMENTADO

### [AUD-03] Checklist mestre de governança
Descrição clara: Existe checklist versionado de controles e status.
Critério de validação objetiva: `audit/master_governance_checklist.md` presente.
Evidência: `audit/master_governance_checklist.md`
Status: ✅ IMPLEMENTADO

### [AUD-04] Matriz de rastreabilidade
Descrição clara: Checklist e evidência possuem amarração explícita.
Critério de validação objetiva: `audit/traceability_matrix.md` presente.
Evidência: `audit/traceability_matrix.md`
Status: ✅ IMPLEMENTADO

### [AUD-05] Validation log
Descrição clara: Há registro das verificações executadas nesta auditoria.
Critério de validação objetiva: `audit/validation_log.md` presente.
Evidência: `audit/validation_log.md`
Status: ✅ IMPLEMENTADO

### [AUD-06] Dashboard HTML interativo
Descrição clara: Existe painel interativo consolidando o checklist.
Critério de validação objetiva: `audit/governance_dashboard.html` presente.
Evidência: `audit/governance_dashboard.html`
Status: ✅ IMPLEMENTADO

### [AUD-07] Manifesto de CI com commit de referência
Descrição clara: Execuções de baseline possuem commit e timestamp.
Critério de validação objetiva: `logs/ci-runs/.../run-manifest.txt` contém `reference_commit`.
Evidência: `logs/ci-runs/20260322-205239_09c4a36/run-manifest.txt`
Status: ✅ IMPLEMENTADO

### [AUD-08] Índice do bundle F11
Descrição clara: O fechamento F11 possui índice versionado.
Critério de validação objetiva: `artifacts/f11-closure-2026-03-22/EVIDENCE_INDEX.md` presente.
Evidência: `artifacts/f11-closure-2026-03-22/EVIDENCE_INDEX.md`
Status: ✅ IMPLEMENTADO

### [AUD-09] Logs F11 com checksums
Descrição clara: Logs do bundle F11 possuem sidecar de checksum.
Critério de validação objetiva: Cada `*.log` em `artifacts/f11-closure-2026-03-22/logs/` possui `*.sha256`.
Evidência: `artifacts/f11-closure-2026-03-22/EVIDENCE_INDEX.md`
Status: ✅ IMPLEMENTADO

### [AUD-10] Artefatos de segurança brutos
Descrição clara: Scans de segurança possuem saídas objetivas arquivadas.
Critério de validação objetiva: Semgrep, audit, inline credentials e OWASP baseline existem em `artifacts/security/`.
Evidência: `artifacts/security/semgrep-f0-initial.json`, `artifacts/security/pnpm-audit-high.json`, `artifacts/security/inline-credential-scan.json`, `artifacts/security/owasp-top10-baseline.json`
Status: ✅ IMPLEMENTADO

### [AUD-11] Relatório de cobertura de segurança
Descrição clara: Existe relatório consolidado de cobertura de segurança.
Critério de validação objetiva: `docs/security/security-coverage-report.md` presente.
Evidência: `docs/security/security-coverage-report.md`
Status: ✅ IMPLEMENTADO

### [AUD-12] Relatório de privacidade
Descrição clara: Existe evidência versionada de verificação de anonimização.
Critério de validação objetiva: `artifacts/privacy/anonymization-report.json` presente.
Evidência: `artifacts/privacy/anonymization-report.json`
Status: ✅ IMPLEMENTADO

### [AUD-13] Relatório de verificação de links
Descrição clara: Existe relatório de integridade documental.
Critério de validação objetiva: `artifacts/documentation/link-check-report.md` presente.
Evidência: `artifacts/documentation/link-check-report.md`
Status: ✅ IMPLEMENTADO

### [AUD-14] Relatório de conformidade de scripts
Descrição clara: Existe relatório versionado de slots `lint/typecheck/test/build` por workspace.
Critério de validação objetiva: `artifacts/script-compliance/workspace-script-compliance.md` presente.
Evidência: `artifacts/script-compliance/workspace-script-compliance.md`
Status: ✅ IMPLEMENTADO

### [AUD-15] Relatório de ownership governance
Descrição clara: Existe relatório gerado de cobertura de ownership.
Critério de validação objetiva: `artifacts/ownership-governance/ownership-governance-report.md` presente.
Evidência: `artifacts/ownership-governance/ownership-governance-report.md`
Status: ✅ IMPLEMENTADO
Notas: true

### [AUD-16] Materialização de controles documentais
Descrição clara: Existe relatório técnico de controles antes apenas documentados.
Critério de validação objetiva: `artifacts/materialization/doc-only-controls-report.md` presente.
Evidência: `artifacts/materialization/doc-only-controls-report.md`
Status: ✅ IMPLEMENTADO

### [AUD-17] Registro de exceções de controles externos
Descrição clara: Bloqueios externos possuem registro explícito e versionado.
Critério de validação objetiva: `ops/governance/external-provisioning-status.md` presente.
Evidência: `ops/governance/external-provisioning-status.md`
Status: ✅ IMPLEMENTADO
Notas: true

### [AUD-18] Smoke evidence de release
Descrição clara: Existe evidência objetiva do smoke de release.
Critério de validação objetiva: `artifacts/release/smoke-summary.json` presente com `ok=true`.
Evidência: `artifacts/release/smoke-summary.json`
Status: ✅ IMPLEMENTADO

### [AUD-19] Preflight de produção com resultado positivo
Descrição clara: Existe evidência objetiva do preflight de produção.
Critério de validação objetiva: `artifacts/release/production-preflight-summary.json` presente com `ok=true`.
Evidência: `artifacts/release/production-preflight-summary.json`
Status: ✅ IMPLEMENTADO
Validação cruzada: 🔵 PENDENTE
Notas: Validação de variáveis/segredos reais depende de ambientes remotos.

### [AUD-20] Evidência de rollback válida
Descrição clara: Existe evidência objetiva e positiva do rehearsal de rollback.
Critério de validação objetiva: `artifacts/release/production-rollback-evidence.json` presente com `ok=true`.
Evidência: `artifacts/release/production-rollback-evidence.json`
Status: ✅ IMPLEMENTADO

### [AUD-21] Política de frescor e revalidação de evidências
Descrição clara: A auditoria deve definir quando evidências expiram e precisam ser regeneradas.
Critério de validação objetiva: Existe documento versionado definindo validade temporal e política de rerun.
Evidência: sem evidência local
Status: ❌ NÃO IMPLEMENTADO
Severidade: 🟠 ALTO
Impacto: Evidências verdes podem envelhecer sem regra formal de expiração.
Risco: Due diligence pode consumir provas desatualizadas.
Consequência prática: A confiança no pacote de auditoria se degrada com o tempo.

### [AUD-22] Proveniência uniforme entre bundles
Descrição clara: Principais bundles deveriam carregar checksum/hash/commit de forma uniforme.
Critério de validação objetiva: Bundles F11, release, security e quality apresentam metadados homogêneos de proveniência.
Evidência: `artifacts/f11-closure-2026-03-22/EVIDENCE_INDEX.md`, `artifacts/release/production-preflight-summary.json`, `artifacts/security/semgrep-f0-initial.json`
Status: ⚠ PARCIAL
Severidade: 🟠 ALTO
Impacto: Parte das evidências possui checksum/timestamp forte, parte não.
Risco: Comparabilidade e cadeia de custódia ficam heterogêneas.
Consequência prática: O pacote de auditoria perde uniformidade forense.

### [AUD-23] Bundle dedicado de isolamento multi-tenant
Descrição clara: Cenários de isolamento deveriam estar arquivados em bundle próprio.
Critério de validação objetiva: Há bundle objetivo de isolamento/cross-tenant com saídas versionadas.
Evidência: `docs/testing/isolation-regression-process.md`, `tests/integration/test_internal_service_auth.py`, `tests/integration/test_orchestrator_event_reliability.py`
Status: ⚠ PARCIAL
Severidade: 🔴 CRÍTICO
Impacto: Há testes e processo, mas não um bundle consolidado de evidência de isolamento.
Risco: Prova de isolamento multi-tenant fica implícita no código e não no pacote auditável.
Consequência prática: Auditoria externa terá esforço alto para validar segurança de tenancy.

### [AUD-24] Outputs legados de auditoria estão quarentenados
Descrição clara: Outputs antigos e ambíguos deveriam ser segregados ou descontinuados formalmente.
Critério de validação objetiva: Arquivos legados de `audit/` fora do conjunto canônico estão arquivados/quarentenados.
Evidência: `audit/checks.json`, `audit/inventory.json`, `audit/report.html`, `audit/saas_maturity_score.md`, `audit/target_architecture.md`, `audit/gaps.md`
Status: ⚠ PARCIAL
Severidade: 🟡 MÉDIO
Impacto: A nova estrutura convive com outputs legados de finalidade incerta.
Risco: Consumidores podem ler o artefato errado.
Consequência prática: Rastreabilidade da auditoria fica poluída.

## Artefatos de Release

### [REL-01] README de release
Descrição clara: A estrutura padrão de release possui ponto de entrada.
Critério de validação objetiva: `releases/README.md` presente.
Evidência: `releases/README.md`
Status: ✅ IMPLEMENTADO

### [REL-02] Catálogo de artefatos de release
Descrição clara: Existe manifesto catalogando artefatos de release.
Critério de validação objetiva: `releases/manifests/release_artifact_catalog.md` presente.
Evidência: `releases/manifests/release_artifact_catalog.md`
Status: ✅ IMPLEMENTADO

### [REL-03] Índice de evidência de release
Descrição clara: Existe ponteiro canônico entre `releases/` e `artifacts/release/`.
Critério de validação objetiva: `releases/evidence/README.md` presente.
Evidência: `releases/evidence/README.md`, `artifacts/release/production-preflight-summary.json`
Status: ✅ IMPLEMENTADO

### [REL-04] Índice de notas de release
Descrição clara: Existe ponteiro canônico para notas e pacotes narrativos.
Critério de validação objetiva: `releases/notes/README.md` presente.
Evidência: `releases/notes/README.md`
Status: ✅ IMPLEMENTADO

### [REL-05] CHANGELOG raiz
Descrição clara: O repositório possui changelog central.
Critério de validação objetiva: `CHANGELOG.md` presente.
Evidência: `CHANGELOG.md`
Status: ✅ IMPLEMENTADO

### [REL-06] Changelogs dos workspaces core
Descrição clara: Apps e packages core possuem changelog próprio.
Critério de validação objetiva: Changelogs existem para API, web, worker e packages relevantes.
Evidência: `apps/api/CHANGELOG.md`, `apps/web/CHANGELOG.md`, `apps/worker/CHANGELOG.md`, `packages/database/CHANGELOG.md`, `packages/logger/CHANGELOG.md`, `packages/security/CHANGELOG.md`
Status: ✅ IMPLEMENTADO

### [REL-07] Workflow de CD
Descrição clara: O processo de release está codificado em pipeline versionado.
Critério de validação objetiva: `.github/workflows/cd.yml` presente.
Evidência: `.github/workflows/cd.yml`
Status: ✅ IMPLEMENTADO

### [REL-08] Gate de staging preflight
Descrição clara: Staging é validado automaticamente antes do deploy.
Critério de validação objetiva: Workflow CD contém job `staging-preflight`.
Evidência: `.github/workflows/cd.yml`
Status: ✅ IMPLEMENTADO

### [REL-09] Gate de production preflight
Descrição clara: Produção exige preflight antes do deploy.
Critério de validação objetiva: Workflow CD contém job `production-preflight`.
Evidência: `.github/workflows/cd.yml`
Status: ✅ IMPLEMENTADO

### [REL-10] Gate de smoke
Descrição clara: Release executa smoke gate antes da promoção.
Critério de validação objetiva: Workflow CD contém job `release-smoke-gate`.
Evidência: `.github/workflows/cd.yml`
Status: ✅ IMPLEMENTADO

### [REL-11] Gate de E2E de release
Descrição clara: Release executa suíte E2E antes da promoção.
Critério de validação objetiva: Workflow CD contém job `release-e2e-gate`.
Evidência: `.github/workflows/cd.yml`
Status: ✅ IMPLEMENTADO

### [REL-12] Gate de evidência de rollback
Descrição clara: Release exige prova de rehearsal de rollback.
Critério de validação objetiva: Workflow CD contém job `rollback-rehearsal-evidence-gate`.
Evidência: `.github/workflows/cd.yml`
Status: ✅ IMPLEMENTADO

### [REL-13] Deploy de produção depende dos gates prévios
Descrição clara: O job final de deploy depende formalmente dos gates críticos.
Critério de validação objetiva: `deploy-production` depende de preflight, smoke, E2E e rollback evidence.
Evidência: `.github/workflows/cd.yml`
Status: ✅ IMPLEMENTADO

### [REL-14] Entradas seladas para preflight
Descrição clara: Arquivos selados de staging/production existem no repositório.
Critério de validação objetiva: `ops/release/sealed/.env.staging.sealed` e `.env.production.sealed` presentes.
Evidência: `ops/release/sealed/.env.staging.sealed`, `ops/release/sealed/.env.production.sealed`
Status: ✅ IMPLEMENTADO
Validação cruzada: 🔵 PENDENTE
Notas: Presença local validada; equivalência com ambientes reais depende de validação externa.

### [REL-15] Artefato de production preflight
Descrição clara: Existe artefato versionado do preflight de produção.
Critério de validação objetiva: `artifacts/release/production-preflight-summary.json` presente com `ok=true`.
Evidência: `artifacts/release/production-preflight-summary.json`
Status: ✅ IMPLEMENTADO
Validação cruzada: 🔵 PENDENTE
Notas: Validação de variáveis/segredos reais depende de ambientes remotos.

### [REL-16] Artefato de smoke
Descrição clara: Existe artefato versionado do smoke de release.
Critério de validação objetiva: `artifacts/release/smoke-summary.json` presente com `ok=true`.
Evidência: `artifacts/release/smoke-summary.json`
Status: ✅ IMPLEMENTADO

### [REL-17] Artefato de rollback
Descrição clara: Existe artefato versionado de rehearsal de rollback.
Critério de validação objetiva: `artifacts/release/production-rollback-evidence.json` presente com `ok=true`.
Evidência: `artifacts/release/production-rollback-evidence.json`
Status: ✅ IMPLEMENTADO

### [REL-18] SBOM arquivado localmente
Descrição clara: O artefato de SBOM da release está presente no workspace.
Critério de validação objetiva: `artifacts/sbom/bom.xml` presente.
Evidência: sem evidência local
Status: ❌ NÃO IMPLEMENTADO
Severidade: 🟠 ALTO
Impacto: Pipeline define geração de SBOM, mas o workspace não arquiva o artefato.
Risco: Rastreabilidade de dependências da release fica incompleta localmente.
Consequência prática: Due diligence de supply chain perde artefato-chave.

### [REL-19] Tag semântica alinhada à versão do pacote
Descrição clara: A versão principal do repositório deve ter tag git correspondente.
Critério de validação objetiva: Existe tag git exatamente igual a `package.json.version`.
Evidência: `package.json`
Status: ❌ NÃO IMPLEMENTADO
Severidade: 🟠 ALTO
Impacto: Versão publicada não está amarrada a tag semântica correspondente.
Risco: Release 1.0.0 não é recuperável por tag formal.
Consequência prática: Histórico de release fica frágil para auditoria e rollback.

### [REL-20] Manifesto de checksums da release
Descrição clara: Artefatos de release deveriam possuir manifesto único de integridade.
Critério de validação objetiva: Existe manifesto versionado de checksums cobrindo `artifacts/release/`.
Evidência: sem evidência local
Status: ❌ NÃO IMPLEMENTADO
Severidade: 🟠 ALTO
Impacto: Release possui artefatos, mas sem manifesto único de integridade.
Risco: Não há verificação uniforme de adulteração ou drift pós-geração.
Consequência prática: Pacote de release fica menos robusto para auditoria forense.

### [REL-21] Notas de release padronizadas em `releases/notes`
Descrição clara: A estrutura padronizada deveria conter notas relevantes e não apenas um stub.
Critério de validação objetiva: Arquivos materiais existem em `releases/notes/` além do README.
Evidência: `releases/notes/README.md`, `docs/release/2026-03-20-go-live-runbook.md`
Status: ⚠ PARCIAL
Severidade: 🟡 MÉDIO
Impacto: Estrutura nova existe, mas notas continuam fora do local padronizado.
Risco: Consumidores enxergam dois centros de release.
Consequência prática: Padronização de release fica incompleta.
